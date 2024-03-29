'use strict';

// importing all components and functions
import { sidebar } from "./sidebar.js";
import { api, imageBaseURL, fetchDataFromServer } from "./api.js";
import { createMovieCard } from "./moviecard.js";
import { search } from "./search.js";

sidebar();

//home page sections ~ toprated, upcoming, trending movies
const homePageSections = [
    {
        title: "Upcoming Movies",
        path: "/movie/upcoming"
    },
    {
        title: "Weekly Trending Movies",
        path: "/trending/movie/week"
    },
    {
        title: "Top Rated Movies",
        path: "/movie/top_rated"
    }
]

// fetching all genres and then changing gender format
const genreList = {
    //creating genre string from genre_id
    asString(genreIdList) {
        let newGenreList = [];
        for (const generId of genreIdList) {
            //this == genreList
            this[generId] && newGenreList.push(this[generId]);
        }
        return newGenreList.join(", ");
    }
};

fetchDataFromServer(`https://api.themoviedb.org/3/genre/movie/list?api_key=${api}`, function ({ genres }) {
    for (const { id, name } of genres) {
        genreList[id] = name;
    }
    fetchDataFromServer(`https://api.themoviedb.org/3/movie/popular?api_key=${api}&page=1`, heroBanner);
});

const pageContent = document.querySelector("[page-content]");

const heroBanner = function ({ results: movieList }) {
    const banner = document.createElement("section");
    banner.classList.add("banner");
    banner.ariaLabel = "Popular Movies";
    banner.innerHTML = `
    <div class="banner-slider"></div>
    <div class="slider-control">
        <div class="control-inner"></div>
    </div>`

    let controlItemIndex = 0;
    for (const [index, movie] of movieList.entries()) {
        const {
            backdrop_path,
            title,
            release_date,
            genre_ids,
            overview,
            poster_path,
            vote_average,
            id
        } = movie;

        const sliderItem = document.createElement("div");
        sliderItem.classList.add("slider-item");
        sliderItem.setAttribute("slider-item", "");
        sliderItem.innerHTML = `
        <img src="${imageBaseURL}w1280${backdrop_path}" alt="${title}" class="img-cover" loading=${index == 0 ? "eager" : "lazy"}>
        <div class="banner-content">
            <h2 class="heading">${title}</h2>
            <div class="meta-list">
                <div class="meta-item">${release_date?.split("-")[0] ?? "Not released!"}</div>
                <div class="meta-item card-badge">${vote_average.toFixed(1)}</div>
            </div>
            <p class="genre">${genreList.asString(genre_ids)}</p>
            <p class="banner-text">${overview}</p>
            <a href="detail.html" class="button" onclick="getMovieDetail(${id})">
                <img src="icons/play-circle.png" width="22" height="22" aria-hidden="true" alt="play circle">
                <span class="span">Watch Now</span>
            </a>
        </div>`;

        banner.querySelector(".banner-slider").appendChild(sliderItem);

        const controlItem = document.createElement("button");
        controlItem.classList.add("poster-box", "slider-item");
        controlItem.setAttribute("slider-control", `${controlItemIndex}`);
        controlItemIndex++;
        controlItem.innerHTML = `
        <img src="${imageBaseURL}w154${poster_path}" alt="Slide to ${title}" loading="lazy" draggable="false" class="img-cover">
        `;

        banner.querySelector(".control-inner").appendChild(controlItem);
    }

    pageContent.appendChild(banner);
    addHeroSlide();

    //fetching data for homepage ~ toprated, upcoming, trending
    for (const { title, path } of homePageSections) {
        fetchDataFromServer(`https://api.themoviedb.org/3${path}?api_key=${api}&page=1`, createMovieList, title);
    }
}


//hero slider
const addHeroSlide = function () {
    const sliderItems = document.querySelectorAll("[slider-item]");
    const sliderControls = document.querySelectorAll("[slider-control]");

    let lastSliderItem = sliderItems[0];
    let lastSliderControl = sliderControls[0];
    lastSliderItem.classList.add("active");
    lastSliderControl.classList.add("active");

    const sliderStart = function () {
        lastSliderItem.classList.remove("active");
        lastSliderControl.classList.remove("active");

        //this == slider-control
        sliderItems[Number(this.getAttribute("slider-control"))].classList.add("active");
        this.classList.add("active");

        lastSliderItem = sliderItems[Number(this.getAttribute("slider-control"))];
        lastSliderControl = this;
    }

    addEventOnElements(sliderControls, "click", sliderStart);
}

const createMovieList = function ({ results: movieList }, title) {
    const movieListEle = document.createElement("section");
    movieListEle.classList.add("movie-list");
    movieListEle.ariaLabel = `${title}`;
    movieListEle.innerHTML = `
    <div class="title-wrapper">
        <h3 class="title-large">${title}</h3>
    </div>
    <div class="slider-list">
        <div class="slider-inner">
            <!-- moviecard -->                    
        </div>
    </div>
    `;

    for (const movie of movieList) {
        //called from movie_card.js
        const movieCard = createMovieCard(movie);

        movieListEle.querySelector(".slider-inner").appendChild(movieCard);
    }

    pageContent.appendChild(movieListEle);
};

search();

//preloader
window.addEventListener("load", () => {
    let loader = document.getElementById("preloader");
    loader.style.display = "none";
});