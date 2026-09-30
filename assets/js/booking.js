/* Form di prenotazione (DEMO: simula la conferma, non invia dati).
   Quando si collega Web3forms/Formspree: sostituire il blocco "simulazione"
   con la fetch verso il servizio e aggiungere il suo dominio a connect-src
   nella Content-Security-Policy di _layouts/default.html. */
(function () {
  const form = document.getElementById('booking-form');
  const success = document.getElementById('booking-success');
  if (!form || !success) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    // Anti-spam: se il campo trappola è compilato è quasi certamente un bot.
    // Si mostra comunque la conferma, senza fare nulla.
    const trap = document.getElementById('sito');
    const isBot = trap && trap.value.trim() !== '';
    const nome = document.getElementById('nome').value.trim();
    document.getElementById('success-name').textContent = nome ? ', ' + nome : '';
    if (!isBot) {
      // --- simulazione: qui andrà l'invio reale ---
    }
    form.classList.add('hide');
    success.classList.add('show');
    success.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
})();
