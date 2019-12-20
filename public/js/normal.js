window.addEventListener("load", init);

const base = "/api";

const cabeceras = {
	'Content-Type': 'application/json',
	'Accept': 'application/json'
};

async function init() {

	var cuestionarios = await cargaCuestionarios();

	for(c of cuestionarios) {
		var preguntas = await cargaPreguntas(c.temaId);
		var nodoC = creaNodoCuestinario(c.temaId, c.tema);
		var nodoI = creaNodoIndice(c.temaId, c.tema);
		for(p of preguntas) {
			var nodoP = creaNodoPregunta(p.preguntaId, p.pregunta, p.respuesta);
			insertAsLastChild(nodoC, nodoP);
		}
		addFormPregunta(nodoC);
		insertAsLastChild(getById('main'), nodoC);
		insertAsLastChild(getById('menu'), nodoI);
	}

	document.querySelector('#nuevoCuestionario input[name="crea"]')
	.addEventListener("click", addCuestionario);
}

function creaNodoCuestinario(temaId, tema) {
	var section = document.createElement('section');
	var encabezado = document.createElement('encabezado-cuestionario');
	section.setAttribute('id', `c${temaId}`);
	encabezado.setAttribute('tema', tema);
	section.appendChild(encabezado);
	return section;
}

function creaNodoIndice(temaId, tema) {
	var li = document.createElement('li');
	var a = document.createElement('a');
	a.setAttribute('href', `#c${temaId}`);
	a.innerText = tema;
	li.appendChild(a);
	return li;
}

function creaNodoPregunta(preguntaId, pregunta, respuesta) {
	var bloque = document.createElement('div');
	var divPregunta = document.createElement('div');
	var divRespuesta = document.createElement('div');
	bloque.setAttribute('class', 'bloque');
	bloque.setAttribute('id', `p${preguntaId}`);
	divPregunta.setAttribute('class', 'pregunta');
	divPregunta.innerText = pregunta;
	divRespuesta.setAttribute('class', 'respuesta');
	divRespuesta.setAttribute('data-valor', 'V' === respuesta);
	bloque.appendChild(divPregunta);
	bloque.appendChild(divRespuesta);
	addCruz(bloque);
	return bloque;
}

function addCuestionario() {

	var tema = document.querySelector('#nuevoCuestionario input[name="tema"]');

	if (tema.value != '') {
		var payload = {
			tema: tema.value
		};
		fetch(`${base}/createma`, {
			method: 'POST',
			headers: cabeceras,
			body: JSON.stringify(payload)
		})
		.then(res => res.json())
		.then(res => {
			if (res.result) {
				var temaId = res.result;
				var cuestionario = creaNodoCuestinario(temaId, tema.value);
				var indice = creaNodoIndice(temaId, tema.value);
				addFormPregunta(cuestionario);
				insertAsLastChild(getById('main'), cuestionario);
				insertAsLastChild(getById('menu'), indice);
				tema.value = '';
			} else {
				console.log(`Error al crear tema ${tema.value}: ${res.error}`);
				window.alert(`No puede haber 2 temas iguales!`);
			}
		})
		.catch(error => console.log(error));
	} else {
		window.alert('No has rellenado todos los datos');
	}
}

function addPregunta(evento) {

	var nodo = evento.target;
	var selector = queryAncestorSelector(nodo, 'section');
	var temaId = selector.id.substr(1);
	var p = document.getElementsByName(`${selector.id}_pregunta`)[0];
	var r = document.querySelector(`input[name="${selector.id}_respuesta"]:checked`);

	if (p.value != '') {
		var payload = {
			pregunta: p.value,
      		respuesta: r.value
		};
		fetch(`${base}/tema/${temaId}/creapregunta`, {
			method: 'POST',
			headers: cabeceras,
			body: JSON.stringify(payload)
		})
		.then(res => res.json())
		.then(res => {
			if(res.result) {
				selector.appendChild(creaNodoPregunta(res.result, p.value, r.value));
				p.value = "";
				document.querySelector(`input[name="${selector.id}_respuesta"]`).checked = "true";
			} else {
				console.log(`Error creando pregunta en tema ${temaId}: ${res.error}`);
				window.alert('Error inesperado creando pregunta :/');
			}
		})
		.catch(error => console.log(error));
	} else {
		window.alert("No has rellenado la pregunta");
	}
}

function cargaCuestionarios() {

	return fetch(`${base}/temas`,{
		method: "GET",
		headers: cabeceras,
	})
	.then(res => res.json())
	.then(res => {
		if(res.result) {
			return res.result;
		} else {
			console.log(`Error al cargar cuestionarios: ${res.error}`);
			return [];
		}
	})
	.catch(error => console.log(error));
}

function cargaPreguntas(temaId) {

	return fetch(`${base}/tema/${temaId}/preguntas`,{
		method: "GET",
		headers: cabeceras,
	})
	.then(res => res.json())
	.then(res => {
		if(res.result) {
			return res.result;
		} else {
			console.log(`Error al cargar preguntas: ${res.error}`);
			return [];
		}
	})
	.catch(error => console.log(error));
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
		'_respuesta" value="V" checked>Verdadero<input type="radio" name="' +
		nodo.id +
		'_respuesta" value="F">Falso</li><li><input type="button" value="Añadir nueva pregunta"></li></ul></div>'
		);
	nodo.querySelector('input[type="button"]').addEventListener("click",
		addPregunta);
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
	var preguntaId = queryAncestorSelector(nodo, ".bloque").id.substr(1);

	fetch(`${base}/pregunta/${preguntaId}`,{
		method: 'DELETE',
		headers: cabeceras,
	})
	.then(res => res.json())
	.then(res => {
		if(res.result) {
			removeElement(queryAncestorSelector(nodo, "div.bloque"));
			if(selector.getElementsByClassName("bloque").length == 0) {
				var temaId = selector.id.substr(1);
				fetch(`${base}/tema/${temaId}`,{
					method: 'DELETE',
					headers: cabeceras,
				})
				.then(res => res.json())
				.then(res => {
					if(res.result) {
						var menu = getById('menu').children;
						for (var i = 0; i < menu.length; i++) {
							if (menu[i].firstElementChild.getAttribute("href").split("#")[1] == selector.id) {
								removeElement(menu[i]);
								break;
							}
						}
						removeElement(selector);
					} else {
						console.log(`Error al borrar el tema: ${res.error}`);
					}					
				})
				.catch(error => console.log(error));
			}
		} else {
			console.log(`Error al borrar la pregunta: ${res.error}`);
		}
	})
	.catch(error => console.log(error));
}

function getById(id) {
	return document.getElementById(id);
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