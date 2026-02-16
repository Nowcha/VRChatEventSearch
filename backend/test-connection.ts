import axios from 'axios';

async function main() {
    try {
        console.log('Testing vrceve.com API connection...');
        const response = await axios.get('https://vrceve.com/wp-json/wp/v2/posts?per_page=1&_fields=id,title');
        console.log('Status:', response.status);
        console.log('Data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

main();
