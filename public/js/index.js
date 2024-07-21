async function createConference(event)
{
    event.preventDefault()

    const roomDisplayName = document.getElementById('roomDisplayName').value
    const userDisplayName = document.getElementById('userDisplayNameC').value

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
                sessionStorage.setItem("roomDisplayName", roomDisplayName)
                sessionStorage.setItem("userDisplayName", userDisplayName)
                window.location.href = `conference.html`
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

    const roomId = document.getElementById('roomId').value
    const roomPass = document.getElementById('roomPass').value
    const userDisplayName = document.getElementById('userDisplayNameJ').value

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
                sessionStorage.setItem("roomDisplayName", result.roomDisplayName)
                sessionStorage.setItem("userDisplayName", userDisplayName)
                window.location.href = `conference.html`
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
