/* Lettore PDF incorporato (pdf.js, self-hosted: nessun servizio esterno).
   Disegna ogni pagina del PDF su un canvas, così il documento si legge allo stesso
   modo su iOS, Android e desktop, senza che il browser lo scarichi. */
(function () {
  var box = document.querySelector('.pdf-viewer');
  if (!box || !window.pdfjsLib) return;

  var src = box.getAttribute('data-src');
  pdfjsLib.GlobalWorkerOptions.workerSrc = box.getAttribute('data-worker');

  var status = document.createElement('p');
  status.className = 'pdf-status';
  status.textContent = 'Caricamento dell’articolo…';
  box.appendChild(status);

  pdfjsLib.getDocument({ url: src, isEvalSupported: false, disableFontFace: true }).promise
    .then(function (pdf) {
      status.remove();
      var cssWidth = Math.min(box.clientWidth - 24, 720);
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var chain = Promise.resolve();
      for (var i = 1; i <= pdf.numPages; i++) {
        chain = chain.then(function (num) {
          return function () {
            return pdf.getPage(num).then(function (page) {
              var base = page.getViewport({ scale: 1 });
              var vp = page.getViewport({ scale: (cssWidth / base.width) * dpr });
              var canvas = document.createElement('canvas');
              canvas.width = Math.floor(vp.width);
              canvas.height = Math.floor(vp.height);
              canvas.style.width = cssWidth + 'px';
              canvas.style.height = 'auto';
              canvas.setAttribute('role', 'img');
              canvas.setAttribute('aria-label', 'Pagina ' + num + ' di ' + pdf.numPages + ' dell’articolo');
              box.appendChild(canvas);
              return page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
            });
          };
        }(i));
      }
      return chain;
    })
    .catch(function () {
      status.textContent = 'Anteprima non disponibile su questo browser: usa il link “Apri il PDF” qui sopra.';
      if (!status.parentNode) box.appendChild(status);
    });
})();
