const peer = new Peer(); // Create a new Peer instance

peer.on('open', (id) => {
    console.log('My peer ID is: ' + id);
});

peer.on('connection', (conn) => {
    conn.on('data', (data) => {
        // Handle incoming data from the other player
        if (data.type === 'position') {
            player2.y = data.position;
        }
    });
});

document.getElementById("startBtn").onclick = () => {
    const conn = peer.connect(/* ID of the other player */); // Obtain the ID from your signaling server
    conn.on('open', () => {
        // Now you can send the username to the connected player
        conn.send({ type: 'username', username: player1.username });
    });

    // Send paddle position to the other player
    setInterval(() => {
        conn.send({ type: 'position', position: player1.y });
    }, 100);
};
