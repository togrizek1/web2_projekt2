document.addEventListener("DOMContentLoaded", () => {
    const usernameInput = document.getElementById('message');
    const pinInput = document.getElementById('pin');
    const checkbox = document.getElementById('vulnerable1');
    const button = document.getElementById('button');
    const infoContainer = document.getElementById('user-info');
    const errorMessage = document.getElementById('error');

    button.addEventListener('click', async () => {
        infoContainer.innerHTML = '';
        const username = usernameInput.value;
        const pin = pinInput.value;
        const isVulnerable = checkbox.checked;

        const data = {
            username: username,
            pin: pin,
            isSqlEnabled: isVulnerable
        };
        try {

            const response = await fetch('/saveMessage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                const userData = await response.json();
                infoContainer.innerHTML = '';

                infoContainer.innerHTML = `
                    <p>ID: ${userData.id}</p>
                    <p>Username: ${userData.username}</p>
                    <p>PIN: ${userData.pin}</p>
                `;

            } else {
                const errorData = await response.json();
                errorMessage.innerHTML = '';
                errorMessage.innerHTML = `${errorData.error}`;
                usernameInput.value = '';
                pinInput.value = '';
            }
        } catch (error) {
            console.error('Error prilikom predaje informacija: ', error);
            alert('Greška prilikom predaje informacija');
        }
    });
});