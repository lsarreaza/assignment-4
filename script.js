const statusMessage = document.querySelector('#status');
const results = document.querySelector('#results');
const form = document.querySelector('#search-form');
const searchInput = document.querySelector('#search-input');

function showValue(value) {
	return value === null || value === undefined || value === '' ? 'Not available' : value;
}

function addDetail(card, label, value) {
	const detail = document.createElement('p');
	detail.textContent = `${label}: ${showValue(value)}`;
	card.append(detail);
}

async function loadCast(show, castDetail) {
	try {
		const response = await fetch(`https://api.tvmaze.com/shows/${show.id}/cast`);

		if (!response.ok) {
			throw new Error(response.status === 429 ? 'Rate limit reached' : 'Cast request failed');
		}

		const cast = await response.json();
		const castNames = cast
			.slice(0, 5)
			.map((entry) => entry.person ? entry.person.name : null)
			.filter(Boolean);
		castDetail.textContent = `Cast: ${showValue(castNames.join(', '))}`;
	} catch (error) {
		castDetail.textContent = error.message === 'Rate limit reached'
			? 'Cast: Rate limit reached. Try again later.'
			: 'Cast: Not available';
	}
}

async function searchShows(searchTerm) {
	const response = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(searchTerm)}`);

	if (!response.ok) {
		throw new Error(response.status === 429 ? 'Rate limit reached' : 'Request failed');
	}

	const shows = await response.json();
	results.replaceChildren();
	statusMessage.textContent = shows.length ? '' : 'No shows found.';

	shows.slice(0, 10).forEach((result) => {
		const show = result.show;
		const card = document.createElement('article');
		const title = document.createElement('h2');
		const link = document.createElement('a');

		title.textContent = showValue(show.name);
		link.href = show.url;
		link.textContent = 'View on TVmaze';

		card.append(title);

		if (show.image && show.image.medium) {
			const poster = document.createElement('img');
			poster.src = show.image.medium;
			poster.alt = `${show.name} poster`;
			card.append(poster);
		} else {
			addDetail(card, 'Poster', 'Not available');
		}

		const summary = show.summary
			? new DOMParser().parseFromString(show.summary, 'text/html').body.textContent
			: 'Not available';
		addDetail(card, 'Summary', summary);
		addDetail(card, 'Premiered', show.premiered);
		addDetail(card, 'Updated', show.updated ? new Date(show.updated * 1000).toLocaleString() : null);
		addDetail(card, 'Genres', show.genres && show.genres.join(', '));
		addDetail(card, 'Rating', show.rating && show.rating.average);

		const castDetail = document.createElement('p');
		castDetail.textContent = 'Cast: Loading...';
		card.append(castDetail);
		card.append(link);
		results.append(card);
		loadCast(show, castDetail);
	});
}

form.addEventListener('submit', (event) => {
	event.preventDefault();
	const searchTerm = searchInput.value.trim();
	results.replaceChildren();
	statusMessage.textContent = '';

	if (!searchTerm) {
		statusMessage.textContent = 'Please enter a show title or keyword.';
		return;
	}

	searchShows(searchTerm).catch((error) => {
		statusMessage.textContent = error.message === 'Rate limit reached'
			? 'Too many requests. Please try again later.'
			: 'Unable to load shows.';
	});
});

searchShows('fullmetal alchemist').catch((error) => {
	statusMessage.textContent = error.message === 'Rate limit reached'
		? 'Too many requests. Please try again later.'
		: 'Unable to load shows.';
});
