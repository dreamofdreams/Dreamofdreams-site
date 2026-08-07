document.addEventListener('DOMContentLoaded', () => {
    const BLOG_CHARACTER_LIMIT = 1250;
    const writingElement = document.querySelector('.parchment-writing');
    
    if (writingElement) {
        const textContent = writingElement.innerText || "";
        const charCount = textContent.length;
        
        // Character count validation
        if (charCount > BLOG_CHARACTER_LIMIT) {
            console.warn(`Blog post exceeds parchment capacity by ${charCount - BLOG_CHARACTER_LIMIT} characters. Maximum recommended length is ${BLOG_CHARACTER_LIMIT} characters.`);
        }
        
        // Overflow detection
        if (writingElement.scrollHeight > writingElement.clientHeight) {
            console.error("Blog post content overflows the parchment writing area!");
            writingElement.style.border = "2px solid red"; // Visual warning for development
        }
    }
});
