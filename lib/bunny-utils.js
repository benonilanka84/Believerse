// lib/bunny-utils.js

/**
 * Utility to move AWS IVS recorded streams into Bunny.net for the permanent wall.
 */
export async function pushLiveArchiveToBunny(userId, s3VideoUrl, streamTitle) {
  try {
    // 1. Create the video placeholder in Bunny Stream
    const createRes = await fetch(`https://video.bunnycdn.com/library/${process.env.BUNNY_LIBRARY_ID}/videos`, {
      method: 'POST',
      headers: {
        'AccessKey': process.env.BUNNY_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        title: streamTitle,
        searchTags: userId // We store the userId here to find it later in the webhook
      })
    });
    
    const { guid: videoId } = await createRes.json();

    // 2. Instruct Bunny to FETCH the video from your AWS S3 bucket
    await fetch(`https://video.bunnycdn.com/library/${process.env.BUNNY_LIBRARY_ID}/videos/${videoId}/fetch`, {
      method: 'POST',
      headers: {
        'AccessKey': process.env.BUNNY_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: s3VideoUrl })
    });

    return videoId;
  } catch (err) {
    console.error("Bridge Error:", err);
    throw err;
  }
}