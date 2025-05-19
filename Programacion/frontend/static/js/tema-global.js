document.addEventListener("DOMContentLoaded", function() {
  var elem = document.querySelector(".theme-element");  // Asegúrate de que este selector coincida con un elemento real
  if (elem) {
    elem.classList.add("loaded");
    console.log("Tema cargado correctamente");
  } else {
    console.warn("No se encontró el elemento .theme-element para aplicar 'loaded'");
  }
});
