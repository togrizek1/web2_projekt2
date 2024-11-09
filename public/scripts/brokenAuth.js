document.addEventListener("DOMContentLoaded", () => {
    const checkbox = document.getElementById("vulnerable2");
    const captchaContainer = document.querySelector(".g-recaptcha");
    const form = document.querySelector("form");
    const infoContainer = document.getElementById('user-login');
    const errorMessage = document.getElementById('error-message');
    captchaContainer.style.display = checkbox.checked ? "none" : "block";

    checkbox.addEventListener("change", () => {
        captchaContainer.style.display = checkbox.checked ? "none" : "block";
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const usernameValue = form.querySelector('input[name="username"]').value.trim();
        const passwordValue = form.querySelector('input[name="password"]').value.trim();

        if (!usernameValue || !passwordValue) {
            errorMessage.innerHTML = 'Username i password moraju biti uneseni.';
            return;
        }


        if (!checkbox.checked) {
            const captchaResponse = grecaptcha.getResponse();

            if (!captchaResponse.length > 0) {
                errorMessage.innerHTML = '';

                errorMessage.innerHTML = 'CAPTCHA nije označena.';
                grecaptcha.reset();
                throw new Error("Captcha nije označena.");
            }

            const fd = new FormData(e.target);
            const params = new URLSearchParams(fd);


            fetch("/login-captcha", {
                method: 'POST',
                body: params,
            })
                .then(res => res.json())
                .then(data => {
                    if (data.captchaSuccess) {

                        console.log(data);
                        infoContainer.innerHTML = '';

                        infoContainer.innerHTML = `
                            <p>Ulogirani korisnik:</p>
                            <i>${data.username}<i/>
                        `;

                        errorMessage.innerHTML = '';
                    } else {
                        errorMessage.innerHTML = '';

                        errorMessage.innerHTML = `${data.error}`;
                        grecaptcha.reset();
                        form.reset();
                    }
                })
                .catch(error => console.error(error))
        } else {
            const fd = new FormData(e.target);
            const params = new URLSearchParams(fd);

            fetch('/login', {
                method: 'POST',
                body: params,
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        infoContainer.innerHTML = '';

                        infoContainer.innerHTML = `
                            <p>Ulogirani korisnik:</p>
                            <i>${data.username}<i/>
                        `;
                        errorMessage.innerHTML = '';
                    } else {
                        errorMessage.innerHTML = '';

                        errorMessage.innerHTML = `${data.error}`;

                    }
                })
                .catch(error => console.log(error));
        }
    });

});