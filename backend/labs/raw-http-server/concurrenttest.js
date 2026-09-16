const start = Date.now();

async function sendRequest(name) {
    console.log(`${name} started`);

    const response = await fetch("http://localhost:3000/feed");

    await response.json();

    console.log(`${name} finished after ${Date.now() - start}ms`);
}

Promise.all([
    sendRequest("Request 1"),
    sendRequest("Request 2")
]);