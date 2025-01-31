function deploy(service) {
    fetch('deploy-service', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ service: service }) 
    })
    .then(response => response.text())
    .then(data => {
        alert(data); 
    })
    .catch(error => {
        console.error('Error:', error);
        alert(`${service} deployment failed`);
    });
}

function scaleInstance(service) {
    const replicaCount = document.getElementById(`${service}-replica`).value;

    fetch('/scale-service', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            service: service ,  
            replicas: replicaCount
        })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message || "Scaling successful!");
    })
    .catch(err => {
        console.error("Error:", err);
        alert("Failed to scale the service.");
    });
}

