let logger = (function () {
    function postLog(username) {
        fetch("/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                login: username,
            }),
        }).then((response) => {
            if (response.ok) {
                window.location.href = "/home";
            } else {
                response.json().then((data) => {
                    data.errors.forEach((error) => {
                        console.error(error.msg);
                        document.getElementById("error").innerHTML = error.msg;
                    });
                });
            }
        });
    }

    return {
        sendLogin(username) {
            postLog(username);
        },
    };
})();

export default logger;