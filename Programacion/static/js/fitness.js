document.addEventListener('DOMContentLoaded', () => {
    const planContainer = document.getElementById('plan-container');
    const generatePlanButton = document.getElementById('generate-plan');

    generatePlanButton.addEventListener('click', () => {
        const level = document.getElementById('level').value;
        const goals = document.getElementById('goals').value.split(',').map(g => g.trim());
        const conditions = document.getElementById('conditions').value.split(',').map(c => c.trim());

        fetch('/generate_plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ level, goals, conditions })
        })
        .then(response => {
            if (!response.ok) {
                if (response.headers.get('Content-Type') !== 'application/json') {
                    throw new Error('El servidor devolvió una respuesta no válida.');
                }
                return response.json().then(err => { throw new Error(err.error); });
            }
            return response.json();
        })
        .then(data => {
            planContainer.innerHTML = '';
            data.plan.forEach(exercise => {
                const div = document.createElement('div');
                div.innerHTML = `<h3>${exercise.name}</h3><p>${exercise.description}</p>`;
                planContainer.appendChild(div);
            });
        })
        .catch(error => {
            console.error("❌ Error:", error);
            alert(`Error: ${error.message}`);
        });
    });
});
