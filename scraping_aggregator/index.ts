import { ApifyClient } from 'apify-client';

// Initialize the ApifyClient with API token
const client = new ApifyClient({
    token: '<YOUR_API_TOKEN>',
});

// Prepare Actor input
const input = {
    "urls": [
        "https://www.instagram.com/reel/DMG24Zjyg1j"
    ]
};

(async () => {
    // Run the Actor and wait for it to finish
    const run = await client.actor("eOGkg9FOOI8vgsSFB").call(input);

    // Fetch and print Actor results from the run's dataset (if any)
    console.log('Results from dataset');
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    items.forEach((item) => {
        console.dir(item);
    });
})();