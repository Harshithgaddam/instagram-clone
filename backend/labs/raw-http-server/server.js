const http = require("node:http");

const PORT = 3000;

const feed = [
    {
        id: "1",
        author: "Asha",
        text: "Learning Node.js HTTP server"
    },
    {
        id: "2",
        author: "Rahul",
        text: "Building my social feed backend"
    },
    {
        id: "3",
        author: "Meera",
        text: "Understanding the Node event loop"
    }
];

function fakeDependencyWait() {
    return new Promise((resolve) => {
        setTimeout(resolve, 2000);
    });
}

const server = http.createServer(async (req, res) => {

    console.log(`${req.method} ${req.url}`);

    const url = new URL(
        req.url,
        `http://${req.headers.host}`
    );
    if (
        req.method === "GET" &&
        url.pathname === "/health/live"
    ) {
        res.statusCode = 200;

        res.setHeader(
            "Content-Type",
            "application/json"
        );

        res.end(
            JSON.stringify({
                status: "ok"
            })
        );

        return;
    }

    if (
        req.method === "GET" &&
        url.pathname === "/feed"
    ) {
        console.log("Before 2000ms dependency wait");

        await fakeDependencyWait();

        console.log("After 2000ms dependency wait");

        res.statusCode = 200;

        res.setHeader(
            "Content-Type",
            "application/json"
        );

        res.end(
            JSON.stringify({
                items: feed
            })
        );

        return;
    }

    // Unknown route
    res.statusCode = 404;

    res.setHeader(
        "Content-Type",
        "application/json"
    );

    res.end(
        JSON.stringify({
            error: "Not Found"
        })
    );
});

server.listen(PORT, () => {
    console.log(
        `Raw HTTP server running at http://localhost:${PORT}`
    );
});