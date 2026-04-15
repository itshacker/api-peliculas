/* ====================================================
   app.js — Buscador de películas con jQuery y OMDb API
   ====================================================

   IMPORTANTE: Sustituye el valor de API_KEY por tu propia
   clave gratuita obtenida en https://www.omdbapi.com/apikey.aspx
   ==================================================== */

$(document).ready(function () {

  // --------------------------------------------------
  // CONFIGURACIÓN
  // --------------------------------------------------
  var API_KEY  = "trilogy";            // <-- cambia esto por tu API key
  var URL_BASE = "https://www.omdbapi.com/";

  // --------------------------------------------------
  // CLÁSICOS DEL CINE — se cargan al abrir la página
  // Cada uno tiene su imdbID para pedirlo directamente
  // --------------------------------------------------
  var CLASICOS = [
    { id: "tt0068646" },   // El Padrino
    { id: "tt0071562" },   // El Padrino II
    { id: "tt0050083" },   // 12 hombres sin piedad
    { id: "tt0108052" },   // La lista de Schindler
    { id: "tt0167260" },   // El Señor de los Anillos: El retorno del rey
    { id: "tt0110912" },   // Pulp Fiction
    { id: "tt0060196" },   // El bueno, el feo y el malo
    { id: "tt0120737" },   // El Señor de los Anillos: La comunidad del anillo
    { id: "tt0137523" },   // El club de la lucha
    { id: "tt0816692" },   // Interstellar
    { id: "tt0073486" },   // Alguien voló sobre el nido del cuco
    { id: "tt0099685" }    // Uno de los nuestros
  ];

  // --------------------------------------------------
  // TRADUCCIÓN DE TIPOS AL ESPAÑOL — quitado para simplificar
  // --------------------------------------------------
  // var TIPOS_ES = {
  //   "movie":   "Película",
  //   "series":  "Serie",
  //   "episode": "Episodio",
  //   "game":    "Videojuego"
  // };

  // function traducirTipo(tipo) {
  //   return TIPOS_ES[tipo] || tipo || "";
  // }

  // --------------------------------------------------
  // AL CARGAR LA PÁGINA: mostramos los clásicos
  // --------------------------------------------------
  cargarClasicos();

  // --------------------------------------------------
  // EVENTO: clic en botón Buscar
  // --------------------------------------------------
  $("#btnBuscar").click(function () {
    buscarPeliculas();
  });

  // --------------------------------------------------
  // EVENTO: pulsar Enter en el input
  // --------------------------------------------------
  $("#inputBusqueda").keypress(function (e) {
    if (e.which === 13) {
      buscarPeliculas();
    }
  });

  // --------------------------------------------------
  // EVENTO: cerrar el modal
  // --------------------------------------------------
  $("#cerrarModal").click(function () {
    cerrarModal();
  });

  // $("#modal").click(function (e) {
  //   if ($(e.target).is("#modal")) {
  //     cerrarModal();
  //   }
  // });

  // $(document).keydown(function (e) {
  //   if (e.key === "Escape") {
  //     cerrarModal();
  //   }
  // });


  // ==================================================
  // FUNCIÓN: cargar los clásicos al inicio
  // ==================================================
  function cargarClasicos() {

    $("#clasicos").empty();

    // Pedimos cada clásico por su imdbID con el parámetro "i"
    $.each(CLASICOS, function (indice, clasico) {

      $.getJSON(URL_BASE, { apikey: API_KEY, i: clasico.id, r: "json" }, function (d) {

        if (d.Response !== "True") return;  // si falla ese título, lo saltamos

        var posterHTML = generarPoster(d.Poster, d.Title, "card-poster");

        var cardHTML =
          '<div class="card" data-imdbid="' + d.imdbID + '">' +
            posterHTML +
            '<div class="card-info">' +
              '<p class="card-titulo">' + d.Title + '</p>' +
              '<div class="card-meta">' +
                '<span class="card-anio">' + (d.Year || "—") + '</span>' +
                '<span class="card-tipo">' + (d.Type || "") + '</span>' +
              '</div>' +
            '</div>' +
          '</div>';

        var $card = $(cardHTML);

        // Al pulsar la card abrimos el detalle
        $card.click(function () {
          abrirDetalle(d.imdbID);
        });

        $("#clasicos").append($card);
      });

    });
  }


  // ==================================================
  // FUNCIÓN PRINCIPAL: buscar películas
  // ==================================================
  function buscarPeliculas() {

    var titulo = $("#inputBusqueda").val().trim();
    var tipo   = $("#filtroTipo").val();
    // var anio   = $("#filtroAnio").val().trim();

    // Validamos que haya algo escrito
    if (titulo === "") {
      mostrarError("Escribe el título de una película para buscar.");
      return;
    }

    mostrarCargando();

    var params = {
      apikey: API_KEY,
      s: titulo,
      r: "json"
    };

    if (tipo !== "")  params.type = tipo;
    // if (anio !== "")  params.y    = anio;

    $.getJSON(URL_BASE, params, function (datos) {

      if (datos.Response === "True") {
        mostrarResultados(datos.Search, titulo);
      } else {
        mostrarError(datos.Error || "No se encontraron resultados para «" + titulo + "».");
      }

    }).fail(function () {
      mostrarError("Error de conexión. Comprueba tu API key o la red.");
    });
  }


  // ==================================================
  // FUNCIÓN: pintar las cards de resultados
  // ==================================================
  function mostrarResultados(peliculas, terminoBuscado) {

    $("#mensajeCargando").hide();
    $("#mensajeError").hide();
    $("#resultados").empty();
    // Borramos el botón de volver si ya existía de una búsqueda anterior
    $(".contenedor-volver").remove();

    // Actualizamos el título de la sección con el término buscado
    $("#tituloResultados").text('Resultados para «' + terminoBuscado + '»');

    // Mostramos resultados y ocultamos los clásicos
    $("#seccionClasicos").hide();
    $("#seccionResultados").show();

    $.each(peliculas, function (indice, pelicula) {

      var posterHTML = generarPoster(pelicula.Poster, pelicula.Title, "card-poster");

      var cardHTML =
        '<div class="card" data-imdbid="' + pelicula.imdbID + '">' +
          posterHTML +
          '<div class="card-info">' +
            '<p class="card-titulo">' + pelicula.Title + '</p>' +
            '<div class="card-meta">' +
              '<span class="card-anio">' + (pelicula.Year || "—") + '</span>' +
              '<span class="card-tipo">' + (pelicula.Type || "") + '</span>' +
            '</div>' +
          '</div>' +
        '</div>';

      var $card = $(cardHTML);

      $card.click(function () {
        abrirDetalle(pelicula.imdbID);
      });

      $("#resultados").append($card);
    });

    // Botón para volver a los clásicos — quitado para simplificar
    // var $btnVolver = $(
    //   '<div class="contenedor-volver">' +
    //     '<button id="btnVolver">← Volver a los clásicos</button>' +
    //   '</div>'
    // );

    // $btnVolver.find("#btnVolver").click(function () {
    //   $("#seccionResultados").hide();
    //   $("#mensajeError").hide();
    //   $(".contenedor-volver").remove();
    //   $("#seccionClasicos").show();
    //   $("#inputBusqueda").val("");
    // });

    // $("#seccionResultados").prepend($btnVolver);
  }


  // ==================================================
  // FUNCIÓN: pedir y mostrar el detalle de una película
  // ==================================================
  function abrirDetalle(imdbID) {

    $("#modalInterior").html(
      '<div class="mensaje-estado"><div class="spinner"></div><p>Cargando detalles...</p></div>'
    );
    $("#modal").show();

    $.getJSON(URL_BASE, { apikey: API_KEY, i: imdbID, plot: "full", r: "json" }, function (d) {

      var posterHTML = generarPoster(d.Poster, d.Title, "modal-poster");

      var imdbBadge = "";
      if (d.imdbRating && d.imdbRating !== "N/A") {
        imdbBadge = '<span class="imdb-badge">⭐ IMDb ' + d.imdbRating + '</span>';
      }

      // Año · tipo · duración
      var subtitulo = [d.Year, d.Type, d.Runtime]
        .filter(function (v) { return v && v !== "N/A"; })
        .join(" · ");

      var detalle =
        '<div class="modal-body">' +
          posterHTML +
          '<div class="modal-detalles">' +
            '<h2 class="modal-titulo">' + d.Title + '</h2>' +
            '<p class="modal-anio-tipo">' + subtitulo + '</p>' +

            (d.Genre && d.Genre !== "N/A" ? '<div class="modal-campo"><strong>Género</strong>' + d.Genre + '</div>' : '') +
            (d.Director && d.Director !== "N/A" ? '<div class="modal-campo"><strong>Director</strong>' + d.Director + '</div>' : '') +
            (d.Actors && d.Actors !== "N/A" ? '<div class="modal-campo"><strong>Reparto</strong>' + d.Actors + '</div>' : '') +
            (d.Country && d.Country !== "N/A" ? '<div class="modal-campo"><strong>País</strong>' + d.Country + '</div>' : '') +
            (d.Language && d.Language !== "N/A" ? '<div class="modal-campo"><strong>Idioma</strong>' + d.Language + '</div>' : '') +
            (d.Awards && d.Awards !== "N/A" ? '<div class="modal-campo"><strong>Premios</strong>' + d.Awards + '</div>' : '') +

            imdbBadge +

            '<p class="modal-sinopsis">' +
              (d.Plot && d.Plot !== "N/A" ? d.Plot : "Sin sinopsis disponible.") +
            '</p>' +
          '</div>' +
        '</div>';

      $("#modalInterior").html(detalle);

    }).fail(function () {
      $("#modalInterior").html(
        '<div class="mensaje-estado mensaje-error"><span class="error-icon">✕</span><p>No se pudieron cargar los detalles.</p></div>'
      );
    });
  }



  function generarPoster(urlPoster, titulo, claseImagen) {

    if (urlPoster && urlPoster !== "N/A") {
      return '<img class="' + claseImagen + '" src="' + urlPoster + '" alt="Póster de ' + titulo + '">';
    }

    // Sin póster: nada
    return '<div class="' + claseImagen + '" style="background:#1f1f1f;"></div>';
  }

  function mostrarCargando() {
    $("#resultados").empty();
    $("#mensajeError").hide();
    $("#mensajeCargando").show();
    $("#seccionClasicos").hide();
    $("#seccionResultados").show();
  }

  function mostrarError(mensaje) {
    $("#mensajeCargando").hide();
    $("#resultados").empty();
    $("#textoError").text(mensaje);
    $("#mensajeError").show();
  }

  function cerrarModal() {
    $("#modal").hide();
    $("#modalInterior").empty();
  }

});
