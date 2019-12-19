(function () {

	class MyCustomHeader extends HTMLElement {
		connectedCallback() {

			var tema = this.getAttribute("tema");
			var imagen = "https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57723/globe_east_540.jpg";
			var descripcion = "";

			var url1 = "https://es.wikipedia.org/w/api.php?origin=*&format=json&action=query&prop=extracts&exintro&explaintext&continue&titles=" + tema;
			var url2 = "https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=46402c6a540d9c2a6c2fb2e3292e11b2&text=" + tema + "&format=json&per_page=10&media=photos&sort=relevance&nojsoncallback=1";
			var url3 = "https://api.flickr.com/services/rest/?method=flickr.photos.getSizes&api_key=46402c6a540d9c2a6c2fb2e3292e11b2&photo_id=";

			var shadow = this.attachShadow({mode: "open"});
			var style = document.createElement("style");
			var h2 = document.createElement("h2");
			var img = document.createElement("img");
			var div = document.createElement("div");

			style.textContent = 'h1 {font-weight: bold; font-size: 25px}'
				+ 'img {vertical-align: text-top; width: 50px; height: 50px; margin-right: 10px; border-width: 1px; border-color: lightgray; border-style: solid}'
				+ '.wiki {font-size: 90%}';
			h2.textContent = "Cuestionario sobre " + tema;
			img.src = imagen;
			img.alt = tema;
			div.className = "wiki";

			shadow.appendChild(style);
			shadow.appendChild(h2);
			h2.insertBefore(img, h2.firstChild);
			shadow.appendChild(div);

			// Sustituto de la función addWikipedia.
			fetch(url1)
			.then(function(response) {
				if(!response.ok) {
					throw Error(response.statusText);
				}
				return response.json();
			})
			.then(function(responseAsJson) {
				for(var i in responseAsJson.query.pages) {
					if(typeof responseAsJson.query.pages[i].extract != "undefined") {
						descripcion += responseAsJson.query.pages[i].extract;
					}
				}
				if(descripcion != "") {
					div.textContent = descripcion;
				}
			});

			// Sustituto de la función addFlickr.
			fetch(url2)
			.then(function(response) {
				if(!response.ok) {
					throw Error(response.statusText);
				}
				return response.json();
			})
			.then(function(responseAsJson) {
				fetch(url3 + responseAsJson.photos.photo[0].id + "&format=json&nojsoncallback=1")
				.then(function(response) {
					if(!response.ok) {
						throw Error(response.statusText);
					}
					return response.json();
				})
				.then(function(responseAsJson) {
					img.src = responseAsJson.sizes.size[0].source;
				})
			})
		}
	}

	window.customElements.define("encabezado-cuestionario", MyCustomHeader);
})();