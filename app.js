$(document).ready(function() {
    
    let CLAVE_API = "d5eba07a9977fdcf5ab24b67d51b5791";
    let URL_BASE = "https://api.themoviedb.org/3";
    let URL_IMG = "https://image.tmdb.org/t/p/w500";
    let IDIOMA = "es-ES";
    
    let pagina = 1;
    let ultimaBusqueda = "";
    let esGenero = false;
    
    let CLASICOS = [550, 73, 111, 103, 6977, 406, 680, 807, 16869];
    
    cargarClasicos();
    ponerEventos();
    
    function ponerEventos() {
        $("#btnBuscar").click(buscar);
        $("#inputBusqueda").keypress(function(e) {
            if(e.which == 13) buscar();
        });
        
        $("#cerrarModal").click(cerrarModal);
        $("#modal").click(function(e) {
            if(e.target.id == "modal") cerrarModal();
        });
        $(document).keyup(function(e) {
            if(e.keyCode == 27) cerrarModal();
        });
    }
    
    function cargarClasicos() {
        $("#clasicos").html("");
        CLASICOS.forEach(function(id, i) {
            $.getJSON(URL_BASE + "/movie/" + id + "?api_key=" + CLAVE_API + "&language=" + IDIOMA)
            .done(function(peli) {
                let tarjeta = hacerTarjeta(peli, i);
                tarjeta.click(function() {
                    detallePeli(peli.id, "movie");
                });
                $("#clasicos").append(tarjeta);
            });
        });
    }
    
    function buscar() {
        let textoBusqueda = $("#inputBusqueda").val().trim();
        let generoSeleccionado = $("#filtroGenero").val();
        
        if(!textoBusqueda && !generoSeleccionado) {
            $("#mensajeError").show().find("#textoError").text("Mete algo pa buscar");
            return;
        }
        
        $("#mensajeCargando").show();
        $("#mensajeError").hide();
        $("#resultados").empty();
        $(".contenedor-volver").remove();
        $("#seccionClasicos").hide();
        $("#seccionResultados").show();
        pagina = 1;
        
        if(textoBusqueda && !generoSeleccionado) {
            buscarPorTitulo(textoBusqueda);
        } else if(!textoBusqueda && generoSeleccionado) {
            buscarPorGenero(generoSeleccionado);
        }
    }
    
    function buscarPorTitulo(consulta) {
        ultimaBusqueda = consulta;
        esGenero = false;
        
        $.getJSON(URL_BASE + "/search/movie", {
            api_key: CLAVE_API, 
            language: IDIOMA, 
            query: consulta,
            page: pagina
        })
        .done(mostrarResultadosTMDB)
        .fail(errorConexion)
        .always(function() {
            $("#mensajeCargando").hide();
        });
    }
    
    function buscarPorGenero(idGenero) {
        ultimaBusqueda = idGenero;
        esGenero = true;
        
        $.getJSON(URL_BASE + "/discover/movie", {
            api_key: CLAVE_API,
            language: IDIOMA,
            with_genres: idGenero,
            sort_by: "popularity.desc",
            page: pagina
        })
        .done(mostrarResultadosTMDB)
        .fail(errorConexion)
        .always(function() {
            $("#mensajeCargando").hide();
        });
    }
    
    function mostrarResultadosTMDB(datos) {
        if(!datos.results.length) {
            $("#mensajeError").show().find("#textoError").text("Nada encontrado");
            return;
        }
        
        let tituloBusqueda = esGenero 
            ? $("#filtroGenero option:selected").text()
            : ultimaBusqueda;
            
        $("#tituloResultados").text("Resultados de '" + tituloBusqueda + "'");
        
        datos.results.forEach(function(peli, i) {
            let tarjeta = hacerTarjeta(peli, i);
            tarjeta.click(function() {
                detallePeli(peli.id, peli.media_type || "movie");
            });
            $("#resultados").append(tarjeta);
        });
        
        if(!$("#btnVolver").length) {
            let volver = $('<div class="contenedor-volver"><button id="btnVolver">← Volver clásicos</button></div>');
            volver.find("#btnVolver").click(volverAClasicos);
            $("#seccionResultados").prepend(volver);
        }
        
        if(datos.total_pages > pagina) {
            botonMas();
        }
    }
    
    function hacerTarjeta(peli, delay) {
        let titulo = peli.title || peli.name || "Sin título";
        let año = (peli.release_date || peli.first_air_date || "").substring(0,4) || "—";
        let tipo = peli.media_type == "tv" ? "Serie" : "Película";
        
        let poster;
        if(peli.poster_path) {
            poster = '<img class="card-poster" src="' + URL_IMG + peli.poster_path + '" alt="' + titulo + '" loading="lazy">';
        } else {
            let iniciales = titulo.split(" ").slice(0,2).map(function(p){return p[0]?p[0].toUpperCase():""}).join("");
            poster = '<div class="card-poster-placeholder"><span class="placeholder-iniciales">' + iniciales + '</span><span class="placeholder-texto">Sin póster</span></div>';
        }
        
        return $(`
            <div class="card" style="animation-delay: ${delay * 0.06}s">
                ${poster}
                <div class="card-info">
                    <p class="card-titulo">${titulo}</p>
                    <div class="card-meta">
                        <span class="card-anio">${año}</span>
                        <span class="card-tipo">${tipo}</span>
                    </div>
                </div>
            </div>
        `);
    }
    
    function botonMas() {
        if($("#btnCargarMas").length) return;
        
        let btn = $('<button id="btnCargarMas">Cargar más</button>');
        btn.click(cargarMasResultados);
        $("#seccionResultados").append(btn);
    }
    
    function cargarMasResultados() {
        pagina++;
        if(esGenero) {
            buscarPorGenero(ultimaBusqueda);
        } else {
            buscarPorTitulo(ultimaBusqueda);
        }
    }
    
    function volverAClasicos() {
        $("#seccionResultados").hide();
        $("#mensajeError").hide();
        $(".contenedor-volver, #btnCargarMas").remove();
        $("#seccionClasicos").show();
        $("#inputBusqueda").val("");
        $("#filtroGenero").val("");
    }
    
    function detallePeli(id, tipo) {
        $("#modalInterior").html('<div class="spinner">Cargando...</div>');
        $("#modal").show();
        
        let puntoFinal = tipo == "tv" ? "/tv/" + id : "/movie/" + id;
        $.getJSON(URL_BASE + puntoFinal + "?api_key=" + CLAVE_API + "&language=" + IDIOMA + "&append_to_response=credits")
        .done(function(datos) {
            mostrarDetalleCompleto(datos);
        })
        .fail(function() {
            $("#modalInterior").html('<div class="error">Error cargando info</div>');
        });
    }
    
    function mostrarDetalleCompleto(peli) {
        let titulo = peli.title || peli.name || "Sin título";
        let año = (peli.release_date || peli.first_air_date || "").substring(0,4) || "—";
        let tipo = peli.media_type == "tv" ? "Serie" : "Película";
        let duracion = peli.runtime ? peli.runtime + "min" : 
                      (peli.episode_run_time && peli.episode_run_time[0] ? peli.episode_run_time[0] + "min/ep" : "");
        
        let poster = peli.poster_path ? 
            '<img class="modal-poster" src="' + URL_IMG + peli.poster_path + '" alt="' + titulo + '">' :
            sinImagenGrande(titulo);
            
        let calificacion = peli.vote_average ? '<span class="rating">⭐ ' + peli.vote_average.toFixed(1) + '</span>' : '';
        let generos = peli.genres ? peli.genres.map(function(g){return g.name}).join(", ") : "";
        let director = peli.credits ? peli.credits.crew.filter(function(p){return p.job=="Director"}).map(function(p){return p.name}).join(", ") : "";
        let actores = peli.credits ? peli.credits.cast.slice(0,4).map(function(p){return p.name}).join(", ") : "";
        let paises = peli.production_countries ? peli.production_countries.map(function(p){return p.name}).join(", ") : "";
        
        $("#modalInterior").html(`
            <div class="modal-body">
                ${poster}
                <div class="info-detalle">
                    <h2>${titulo}</h2>
                    <p>${año} • ${tipo} ${duracion ? '• ' + duracion : ''}</p>
                    ${generos ? '<p><strong>Géneros:</strong> ' + generos + '</p>' : ''}
                    ${director ? '<p><strong>Director:</strong> ' + director + '</p>' : ''}
                    ${actores ? '<p><strong>Reparto:</strong> ' + actores + '</p>' : ''}
                    ${paises ? '<p><strong>País:</strong> ' + paises + '</p>' : ''}
                    ${calificacion}
                    <div class="sinopsis">${peli.overview || "Sin sinopsis"}</div>
                </div>
            </div>
        `);
    }
    
    function sinImagenGrande(titulo) {
        let iniciales = titulo.split(" ").slice(0,2).map(function(p){return p[0]?p[0].toUpperCase():""}).join("");
        return '<div class="modal-poster-placeholder"><span class="iniciales">' + iniciales + '</span><span>Sin póster</span></div>';
    }
    
    function cerrarModal() {
        $("#modal").hide();
    }
    
    function errorConexion() {
        $("#mensajeError").show().find("#textoError").text("Sin conexión o API key chunga");
    }
});