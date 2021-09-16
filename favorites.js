// Global variables / constants
const BASE_URL = 'https://lighthouse-user-api.herokuapp.com/api/v1'
const INDEX_URL = `${BASE_URL}/users`
const dataPanel = document.querySelector('#data-panel')
const topPanel = document.querySelector('#top-panel')
const formSelectAge = document.querySelector('#form-select-age')
const formSelectRegion = document.querySelector('#form-select-region')
const paginator = document.querySelector('#paginator')
const modalFooter = document.querySelector('#friend-modal-footer')

const FRIENDS_PER_PAGE = 12
let TOTAL_PAGES = 0
let CURRENT_PAGE = 1
const friendList = JSON.parse(localStorage.getItem('favoriteFriendList')) || []
let filteredFriendList = []
const countryMap = {
  ch: 'Switzerland (CH)',
  au: 'Australia (AU)',
  ca: 'Canada (CA)',
  de: 'Germany (DE)',
  br: 'Brazil (BR)',
  us: 'United States (US)',
  no: 'Norway (NO)',
  tr: 'Turkey (TR)',
  es: 'Spain (ES)',
  fi: 'Finland (FI)',
  nz: 'New Zealand (NZ)',
  dk: 'Denmark (DK)',
  nl: 'Netherlands (NL)',
  ir: 'Iran (IR)',
  ie: 'Ireland (IE)',
  gb: 'United Kingdom (GB)',
  fr: 'France (FR)'
}


/////////////// Function Group Starts Here /////////////////
// Render friend list in data panel
function renderFriendList(data) {
  // Using array.map to create an array of HTML contents, then use 
  // join function to merge them together
  if (data.length === 0) {
    dataPanel.innerHTML = `
    <img class="my-5 w-75 mx-auto" src="https://webmarketingschool.com/wp-content/uploads/2018/03/nojobsfound.png">
    `
  } else {
    dataPanel.innerHTML = data.map(dataItem => {
      return `
    <div class="col-12 col-sm-6 col-md-4 col-lg-3 pb-3">
      <div class="card">
        <div class="card-image-wrapper">
          <img src="${dataItem.avatar}" alt="friend-image" data-bs-toggle="modal" data-bs-target="#friend-modal" data-id=${dataItem.id}>
        </div>
        <div class="card-body">
          <h5 class="card-title">${dataItem.name} ${dataItem.surname}</h5>
        </div>
      </div>
    </div>
    `
    }).join('')
  }
}

// Get friend data array by specific page
function getFriendDataByPage(page) {
  const endIndex = page * FRIENDS_PER_PAGE
  const startIndex = endIndex - FRIENDS_PER_PAGE
  const data = filteredFriendList.length ? filteredFriendList : friendList

  return data.slice(startIndex, endIndex)
}

// Render age options for search form
function renderFormAgeOptions(data) {
  const ageGroup = 5
  let minAge = 100
  let maxAge = 0

  data.forEach(dataItem => {
    if (dataItem.age > maxAge) maxAge = dataItem.age
    if (minAge > dataItem.age) minAge = dataItem.age
  })
  const ageDifference = Math.ceil((maxAge - minAge) / ageGroup)

  let rawHTML = '<option>All</option>'
  if (data.length !== 0) {
    for (let i = 0; i < ageGroup; i++) {
      const startAgeNumber = (i * ageDifference) + minAge
      const endAgeNumber = startAgeNumber + ageDifference
      rawHTML += `
    <option>${startAgeNumber} - ${endAgeNumber}</option>
    `
    }
  }
  formSelectAge.innerHTML = rawHTML
}

// Render region options for search form
function renderFormRegionOptions(data) {
  const regionArray = []
  let rawHTML = '<option>All</option>'

  data.forEach(dataItem => {
    if (!regionArray.includes(dataItem.region)) {
      regionArray.push(dataItem.region)
      rawHTML += `
      <option value="${dataItem.region}">${countryMap[dataItem.region.toLowerCase()]}</option>
      `
    }
  })
  formSelectRegion.innerHTML = rawHTML
}

// Process friend data array by filtering options
function filterFriendsByForm(data) {
  const formSearch = document.querySelector('#form-search')
  const keyword = formSearch.value.trim().toLowerCase()
  const formCheckboxMale = document.querySelector('#form-checkbox-male').checked ? 'male' : ''
  const formCheckboxFemale = document.querySelector('#form-checkbox-female').checked ? 'female' : ''
  const region = formSelectRegion.value !== 'All' ? formSelectRegion.value : ''
  let minAge = 0
  let maxAge = 100

  if (formSelectAge.value !== 'All') {
    const regex = /(\d+) - (\d+)/
    minAge = Number(regex.exec(formSelectAge.value)[1])
    maxAge = Number(regex.exec(formSelectAge.value)[2])
  }

  filteredFriendList = data.filter(friend => friend.name.toLowerCase().includes(keyword))
  filteredFriendList = filteredFriendList.filter(friend => friend.gender === formCheckboxMale || friend.gender === formCheckboxFemale)
  filteredFriendList = filteredFriendList.filter(friend => friend.age >= minAge && friend.age <= maxAge)
  filteredFriendList = filteredFriendList.filter(friend => friend.region.includes(region))
}

// Render friend detail in modal
function renderFriendModal(id) {
  // Using querySelector to extract specific DOM object for later change
  const name = document.querySelector('#friend-modal-name')
  const region = document.querySelector('#friend-modal-region')
  const age = document.querySelector('#friend-modal-age')
  const gender = document.querySelector('#friend-modal-gender')
  const email = document.querySelector('#friend-modal-email')
  const image = document.querySelector('#friend-modal-image')
  const removeFavoriteBtn = document.querySelector('#friend-modal-remove-favorite')
  // Get rid of image first 
  image.innerHTML = ''

  axios.get(`${INDEX_URL}/${id}`)
    .then(rep => {
      const data = rep.data
      // Once extract all the data from server, we're going to map
      // related data to the modal content
      name.textContent = `${data.name} ${data.surname}`
      region.textContent = data.region
      age.textContent = data.age
      gender.textContent = data.gender
      email.href = `mailto://${data.email}`
      image.innerHTML = `
    <img src="${data.avatar}" alt="friend-image">
    `
      removeFavoriteBtn.dataset.id = data.id
    }).catch(err => console.log(err))
}

// Render dynamic paginator, and toggle current page
function renderPaginator(page) {
  const data = filteredFriendList.length ? filteredFriendList : friendList
  TOTAL_PAGES = Math.ceil(data.length / FRIENDS_PER_PAGE)
  const pageArray = [page - 2, page - 1, page, page + 1, page + 2]

  let rawHTML = `
      <li class="page-item">
        <a class="page-link page-previous" href="#data-panel" aria-label="Previous">
          <span class="page-previous" aria-hidden="true">&laquo;</span>
        </a>
      </li>
  `
  if (!pageArray.includes(1)) {
    rawHTML += `
      <li class="page-item"><a class="page-link page-number" href="#data-panel" data-page="1">1</a></li>
      <li class="page-item"><a class="page-link" href="#">...</a></li>
    `
  }

  pageArray.forEach(pageItem => {
    if (pageItem > 0 && pageItem <= TOTAL_PAGES) {
      if (pageItem === page) {
        rawHTML += `
        <li class="page-item active"><a class="page-link page-number" href="#data-panel" data-page="${pageItem}">${pageItem}</a></li>
      `
      } else {
        rawHTML += `
        <li class="page-item"><a class="page-link page-number" href="#data-panel" data-page="${pageItem}">${pageItem}</a></li>
      `
      }
    }
  })

  if (!pageArray.includes(TOTAL_PAGES)) {
    rawHTML += `
      <li class="page-item"><a class="page-link" href="#">...</a></li>
      <li class="page-item"><a class="page-link page-number" href="#data-panel" data-page="${TOTAL_PAGES}">${TOTAL_PAGES}</a></li>
    `
  }
  rawHTML += `
      <li class="page-item">
        <a class="page-link page-next" href="#data-panel" aria-label="Next">
          <span class="page-next" aria-hidden="true">&raquo;</span>
        </a>
      </li>
  `
  paginator.innerHTML = rawHTML
}

// Remove favorite item from localStorage
function removeFromFavorites(id) {
  const removedIndex = friendList.findIndex(friend => friend.id === id)
  friendList.splice(removedIndex, 1)
  localStorage.setItem('favoriteFriendList', JSON.stringify(friendList))
}
/////////////// Function Group Ends Here /////////////////


/////////////// Event Listener Group Starts Here /////////////////
// For search form
topPanel.addEventListener('input', function onTopPanelInput() {
  filterFriendsByForm(friendList)

  if (!filteredFriendList.length) {
    renderFriendList(filteredFriendList)
    paginator.innerHTML = ''
    return
  }
  
  renderFriendList(getFriendDataByPage(1))
  renderPaginator(1)
})

// For friend list
dataPanel.addEventListener('click', function onDataPanelClicked(event) {
  if (event.target.matches('.card-image-wrapper img')) {
    renderFriendModal(Number(event.target.dataset.id))
  }
})

// For paginator
paginator.addEventListener('click', function onPaginatorClicked(event) {

  if (event.target.tagName === 'A' || event.target.tagName === 'SPAN') {
    const activeLink = document.querySelector('li.page-item.active')

    if (event.target.matches('a.page-number')) {
      CURRENT_PAGE = Number(event.target.dataset.page)
    } else if (event.target.matches('.page-previous')) {
      CURRENT_PAGE = Number(activeLink.firstElementChild.dataset.page) - 1 || 1
    } else if (event.target.matches('.page-next')) {
      CURRENT_PAGE = Number(activeLink.firstElementChild.dataset.page) + 1 > TOTAL_PAGES ?
      TOTAL_PAGES : Number(activeLink.firstElementChild.dataset.page) + 1
    } else return

    renderFriendList(getFriendDataByPage(CURRENT_PAGE))
    renderPaginator(CURRENT_PAGE)
  }
})

// For modal
modalFooter.addEventListener('click', function onModalFooterClicked(event) {
  if (event.target.matches('#friend-modal-remove-favorite')) {
    removeFromFavorites(Number(event.target.dataset.id))
    location.reload()
  }
})
/////////////// Event Listener Group Ends Here /////////////////


// Initialize the friend list and invoke the function to render
renderFriendList(getFriendDataByPage(1))
renderFormAgeOptions(friendList)
renderFormRegionOptions(friendList)
renderPaginator(1)