
async function downloadEmoji(imageUrl){
    const response = await fetch(imageUrl);
    const buffer = await response.buffer();
    return buffer;
}