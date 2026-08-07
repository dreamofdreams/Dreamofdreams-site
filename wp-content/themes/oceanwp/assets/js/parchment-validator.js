document.addEventListener('DOMContentLoaded', () => {
    // Development flag: set to false in production
    const DEBUG_MODE = false; 
    const BLOG_CHARACTER_LIMIT = 950;
    const writingElement = document.querySelector('.parchment-writing');
    
    if (writingElement) {
        const textContent = writingElement.innerText || "";
        const charCount = textContent.length;
        
        // Character count validation
        if (charCount > BLOG_CHARACTER_LIMIT) {
            console.error(`VALIDATION ERROR: Article exceeds parchment capacity by ${charCount - BLOG_CHARACTER_LIMIT} characters. Maximum recommended length is ${BLOG_CHARACTER_LIMIT} characters.`);
        }
        
        // Overflow detection
        if (writingElement.scrollHeight > writingElement.clientHeight) {
            console.error(`VALIDATION ERROR: Article rendered height exceeds safe writing area by ${writingElement.scrollHeight - writingElement.clientHeight}px.`);
            
            if (DEBUG_MODE) {
                writingElement.style.border = "2px solid red"; // Visual warning for development
            }
        }
    }
});
