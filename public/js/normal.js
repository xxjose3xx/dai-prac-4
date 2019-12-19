window.addEventListener("load", init);

const base = "/api/";

const cabeceras = {
	'Content-Type': 'application/json',
	'Accept': 'application/json'
};

function init() {
	for (bloque of document.getElementsByClassName("bloque")) {
		addCruz(bloque);
	}

	for (seccion of document.getElementsByTagName("section")) {
		addFormPregunta(seccion);
	}

	document.querySelector('#nuevoCuestionario input[name="crea"]')
	.addEventListener("click", addCuestionario);
}

function addCruz(nodo) {
	nodo.insertAdjacentHTML('afterbegin', '<div class="borra">☒</div>');
	nodo.firstChild.addEventListener("click", borraPregunta);
}

function addFormPregunta(nodo) {
	nodo.querySelector("encabezado-cuestionario").insertAdjacentHTML("afterend",
		'<div class="formulario"><ul><li><label>Enunciado de la pregunta:</label><input type="text" name="' +
		nodo.id +
		'_pregunta"></li><li><label>Respuesta:</label><input type="radio" name="' +
		nodo.id +
		'_respuesta" value="verdadero" checked>Verdadero<input type="radio" name="' +
		nodo.id +
		'_respuesta" value="falso">Falso</li><li><input type="button" value="Añadir nueva pregunta"></li></ul></div>'
		);
	nodo.querySelector('input[type="button"]').addEventListener("click",
		addPregunta);
}

function addPregunta(evento) {

	var nodo = evento.target;
	var selector = queryAncestorSelector(nodo, "section");

	var p = document.getElementsByName(selector.id + "_pregunta")[0];
	var r = document.querySelector('input[name="' + selector.id +
		'_respuesta"]:checked');

	if (p.value != "") {
		var bloque = document.createElement("div");
		var pregunta = document.createElement("div");
		var respuesta = document.createElement("div");

		bloque.setAttribute("class", "bloque");
		pregunta.setAttribute("class", "pregunta");
		pregunta.innerText = p.value;
		respuesta.setAttribute("class", "respuesta");
		respuesta.setAttribute("data-valor", "verdadero" == r.value);

		bloque.appendChild(pregunta);
		bloque.appendChild(respuesta);
		selector.appendChild(bloque);

		addCruz(bloque);

		p.value = "";
		document.querySelector('input[name="' + selector.id + '_respuesta"]')
		.checked = "true";

	} else {
		window.alert("No has rellenado la pregunta");
	}
}

function addCuestionario() {

	var tema = document.querySelector('#nuevoCuestionario input[name="tema"]');

	if (tema.value != "") {
		fetch(base + "/createma", {
			method: "POST",
			headers: cabeceras,
			body: {
				tema: tema.value
			}
		})
		.then(response => response.json())
		.then(r => {
			if (r.result) {
				document.getElementsByTagName("main")[0]
				.insertAdjacentHTML('beforeend',
					'<section id="tema' + r.result +
					'"><encabezado-cuestionario tema="' + tema
					.value +
					'"></encabezado-cuestionario></section>');
				document.getElementById("menu").insertAdjacentHTML(
					'beforeend', '<li><a href="#tema' + r.result +
					'">' + tema.value + '</a></li>');
				addFormPregunta(document.getElementById("tema" + r
					.result));
				tema.value = "";
			} else {
				console.log("Fallo en la creación del tema " + tema
					.value + ": " + r.error);
			}
		});
	} else {
		window.alert("No has rellenado todos los datos.");
	}
}

function insertAsLastChild(padre, nuevoHijo) {
	padre.appendChild(nuevoHijo);
}

function insertAsFirstChild(padre, nuevoHijo) {
	if (padre.firstChild)
		padre.insertBefore(nuevoHijo, padre.insertAsFirstChild);
	else
		padre.appendChild(nuevoHijo);
}

function insertBeforeChild(padre, hijo, nuevoHijo) {
	padre.insertBefore(nuevoHijo, hijo);
}

function removeElement(nodo) {
	nodo.remove();
}

function borraPregunta(evento) {

	var nodo = evento.target;
	var selector = queryAncestorSelector(nodo, "section");

	if (selector.getElementsByClassName("bloque").length > 1)
		removeElement(queryAncestorSelector(nodo, "div.bloque"));
	else {
		var menu = document.getElementById("menu").children;
		for (var i = 0; i < menu.length; i++) {
			if (menu[i].firstElementChild.getAttribute("href").split("#")[1] ==
				selector.id) {
				removeElement(menu[i]);
			break;
		}
	}
	removeElement(selector);
}
}

function queryAncestorSelector(node, selector) {
	var parent = node.parentNode;
	var all = document.querySelectorAll(selector);
	var found = false;
	while (parent !== document && !found) {
		for (var i = 0; i < all.length && !found; i++) {
			found = (all[i] === parent) ? true : false;
		}
		parent = (!found) ? parent.parentNode : parent;
	}
	return (found) ? parent : null;
}