(function() {
  const statusDiv = document.getElementById("paypal-checkout-status");
  const backendUrl = "https://dreamofdreams-paypal-live-97975815838.us-central1.run.app";

  if (!window.paypal) {
    console.error("PayPal SDK not loaded");
    if (statusDiv) {
      statusDiv.innerText = "Payment gateway could not be loaded. Please reload or contact support@dreamofdreams.com.";
      statusDiv.style.color = "#ef5350";
    }
    return;
  }

  window.paypal.Buttons({
    style: {
      layout: "vertical",
      color: "gold",
      shape: "rect",
      label: "paypal"
    },
    createOrder: async function() {
      if (statusDiv) {
        statusDiv.innerText = "Initiating payment with checkout backend...";
        statusDiv.style.color = "#C5A059";
      }
      try {
        const res = await fetch(backendUrl + "/api/paypal/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });
        if (!res.ok) throw new Error("Backend order creation failed");
        const data = await res.json();
        if (statusDiv) {
          statusDiv.innerText = "Order created! Redirecting to secure PayPal portal...";
        }
        return data.orderId;
      } catch (err) {
        console.error("PayPal Order Creation Error:", err);
        if (statusDiv) {
          statusDiv.innerText = "Unable to initialize checkout. Please contact support@dreamofdreams.com.";
          statusDiv.style.color = "#ef5350";
        }
      }
    },
    onApprove: async function(data, actions) {
      if (statusDiv) {
        statusDiv.innerText = "Payment authorized. Reconciling transaction and generating secure download link...";
        statusDiv.style.color = "#C5A059";
      }
      try {
        const res = await fetch(backendUrl + "/api/paypal/capture-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: data.orderID })
        });
        if (!res.ok) throw new Error("Payment capture verification failed");
        const captureResult = await res.json();
        const status = captureResult.status;
        
        if (status === "fulfillment_eligible" || status === "fulfillment_issued") {
          if (statusDiv) {
            statusDiv.innerHTML = `<span style="color:#81c784; font-size:15px; display:block; margin-bottom:5px; font-weight:bold;">✓ Checkout Successful!</span>Thank you! Payment of $29.99 verified (Order ID: ${data.orderID}).<br>Check your email shortly for your secure download link!`;
            statusDiv.style.color = "#fdfbf7";
          }
        } else if (status === "capture_verified") {
          if (statusDiv) {
            statusDiv.innerHTML = `<span style="color:#ffd54f; font-size:15px; display:block; margin-bottom:5px; font-weight:bold;">Payment Received</span>Payment of $29.99 received (Order ID: ${data.orderID}).<br>We are securely verifying your purchase. Your download link will be emailed once verification is complete.`;
            statusDiv.style.color = "#fdfbf7";
          }
        } else {
          console.error("Unexpected checkout status:", status);
          if (statusDiv) {
            statusDiv.innerText = "Your payment status requires additional verification. Please contact support@dreamofdreams.com if you do not receive your download email.";
            statusDiv.style.color = "#ffd54f";
          }
        }
      } catch (err) {
        console.error("PayPal Capture Verification Error:", err);
        if (statusDiv) {
          statusDiv.innerText = "Payment verification error. Please contact support@dreamofdreams.com.";
          statusDiv.style.color = "#ef5350";
        }
      }
    },
    onError: function(err) {
      console.error("PayPal SDK Error:", err);
      if (statusDiv) {
        statusDiv.innerText = "Transaction error. Please try again or contact support@dreamofdreams.com.";
        statusDiv.style.color = "#ef5350";
      }
    }
  }).render("#paypal-button-container");
})();