let creationMode = false; // mode création indépendant de la liste

document.addEventListener('DOMContentLoaded', function() {
    if (!window.firebase || !firebase.apps.length) {
        console.error('Firebase n\'a pas été initialisé - vérifiez votre configuration.');
        return;
    }
  
    loadPseudos();
    attachFormSubmitEvent();
    attachCreatePseudoButton();
});


function loadPseudos() {
    var pseudosRef = firebase.database().ref('/scores');
    var existingPlayersSelect = document.getElementById('existing-players');

    pseudosRef.once('value', function(snapshot) {
        var pseudos = snapshot.val() || {};
        existingPlayersSelect.innerHTML = '<option value="" disabled selected>Choisissez votre pseudo !</option>';
        Object.keys(pseudos).forEach(function(pseudo) {
            var option = document.createElement('option');
            option.value = option.textContent = pseudo; // Ici, nous utilisons pseudo comme valeur et texte
            existingPlayersSelect.appendChild(option);
        });

        existingPlayersSelect.style.display = 'block';
    });
}


function attachFormSubmitEvent() {
    document.getElementById('start-form').addEventListener('submit', function(event) {
        event.preventDefault();
        var existingPlayersSelect = document.getElementById('existing-players');
        var newPlayerInput = document.getElementById('new-player');
        var selectedPlayer = existingPlayersSelect.value;
        var newPlayer = newPlayerInput.value.trim();

        if (creationMode) {
            if (!newPlayer) {
                alert('Veuillez entrer un nouveau pseudo.');
                return;
            }
            if (newPlayer.length > 20) {
                alert('Le pseudo doit contenir au maximum 20 caractères.');
                return;
            }
            createNewPlayer(newPlayer);
        } else {
            if (!selectedPlayer) {
                alert('Veuillez sélectionner un pseudo ou créer un nouveau pseudo.');
                return;
            }
            sessionStorage.setItem('playerName', selectedPlayer);
            window.location.href = 'choixDuJeu.html';
        }
    });
}

function setCreationMode(on) {
    creationMode = !!on;
    var newPlayerInput = document.getElementById('new-player');
    newPlayerInput.style.display = creationMode ? 'block' : 'none';
    var select = document.getElementById('existing-players');
    if (select) select.style.display = creationMode ? 'none' : 'block';
    if (creationMode) newPlayerInput.focus();
}

function attachCreatePseudoButton() {
    var btn = document.getElementById('create-pseudo-btn');
    if (!btn) return;
    btn.addEventListener('click', function() {
        setCreationMode(true);
    });
}

function createNewPlayer(pseudo) {
    var database = firebase.database();
    var pseudosRef = database.ref('scores');
    if (pseudo.length > 20) {
        alert('Le pseudo doit contenir au maximum 20 caractères.');
        return;
    }

    // Vérifiez d'abord si le pseudo existe déjà.
    pseudosRef.child(pseudo).once('value', function(snapshot) {
        if (snapshot.exists()) {
            alert('Ce pseudo existe déjà.');
        } else {
            // Définissez les scores pour le nouveau joueur.
            var initialScores = {
                jeu1: 0 // Score initial pour le jeu 1
                ,jeu2: 0
                ,jeu3: 0
                ,jeu4: 0
                ,jeu5: 0
                ,jeu6: 0
                ,jeu7: 0
                ,jeu8: 0
                ,jeu9: 0
                ,jeu10: 0
                // Ajoutez d'autres jeux ici si nécessaire
            };

            // Créez une nouvelle entrée avec le pseudo comme clé et les jeux comme sous-clés.
            pseudosRef.child(pseudo).set(initialScores, function(error) {
                if (error) {
                    console.log("Data could not be saved." + error);
                } else {
                    console.log("Data saved successfully.");
                    continueWithPlayerName(pseudo); // Continuez avec le processus, si nécessaire.
                }
            });
        }
    });
}


function continueWithPlayerName(pseudo) {
    sessionStorage.setItem('playerName', pseudo);
    window.location.href = 'choixDuJeu.html';
    // Notez que cette fonction doit être définie quelque part, elle est appelée après la création du nouveau pseudo
}
