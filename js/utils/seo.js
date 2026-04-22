export function updateMetaTags({ title, description, image, url }) {
    // Base title
    const baseTitle = 'Novelia ID';
    const fullTitle = title ? `${title} | ${baseTitle}` : baseTitle;
    
    // Update Title
    document.title = fullTitle;
    
    // Update Description
    if (description) {
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.name = "description";
            document.head.appendChild(metaDesc);
        }
        // Truncate description for SEO (usually around 155-160 chars)
        metaDesc.content = description.length > 155 ? description.substring(0, 152) + '...' : description;
    }

    // Update Open Graph tags
    updateOgTag('og:title', fullTitle);
    
    if (description) {
        updateOgTag('og:description', description.length > 155 ? description.substring(0, 152) + '...' : description);
    }
    
    if (image) {
        // Construct full URL for OG image if it's a relative path
        const fullImageUrl = image.startsWith('http') ? image : window.location.origin + window.location.pathname + image;
        updateOgTag('og:image', fullImageUrl);
    }
    
    if (url) {
        updateOgTag('og:url', window.location.href);
    }
}

function updateOgTag(property, content) {
    let tag = document.querySelector(`meta[property="${property}"]`);
    if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
}
