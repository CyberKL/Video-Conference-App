async function createConference(event)
{
    event.preventDefault()

    let roomDisplayName = document.getElementById('roomDisplayName').value

    if(roomDisplayName) {
        try {
            const response = await fetch('/create-conference', {
                "method": 'POST',
                "headers": {
                    "Content-type": 'application/json'
                },
                "body": JSON.stringify({roomDisplayName})
            })

            const result = await response.json();

            if (result.success) {
                window.location.href = `conference.html?roomDisplayName=${encodeURIComponent(result.roomDisplayName)}&roomId=${encodeURIComponent(result.roomId)}&roomPass=${encodeURIComponent(result.roomPass)}`;
            } else {
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


async function joinConference(event)
{
    event.preventDefault()

    let roomId = document.getElementById('roomId').value
    let roomPass = document.getElementById('roomPass').value

    if(roomId && roomPass) {
        try {
            const response = await fetch('/join-conference', {
                "method": 'POST',
                "headers": {
                    "Content-type": 'application/json'
                },
                "body": JSON.stringify({roomId, roomPass})
            })

            const result = await response.json();

            if (result.success) {
                window.location.href = `conference.html?roomDisplayName=${encodeURIComponent(result.roomDisplayName)}&roomId=${encodeURIComponent(result.roomId)}&roomPass=${encodeURIComponent(result.roomPass)}`;
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error('Error: ', error)
        }
    } else {
        alert('Please enter a room id and password')
        return
    }
}
