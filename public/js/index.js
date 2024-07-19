async function createConference(event)
{
    event.preventDefault()

    let roomDisplayName = document.getElementById('roomDisplayName').value

    if(roomDisplayName) {
        try {
            const response = await fetch('/create-room', {
                "method": 'POST',
                "headers": {
                    "Content-type": 'application/json'
                },
                "body": JSON.stringify({roomDisplayName})
            })

            if(response.redirected) {
                window.location.href = response.url
            } else {
                const result = await response.json();
                alert(result.message);
            }
        } catch (error) {
            console.error('Error: ', error)
        }
    } else {
        alert('Please enter a room name')
        return
    }
}

