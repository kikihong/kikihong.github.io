/**
 * Wikipedia Main Page Interactive Logic
 * Link Previews, Live Search Autocomplete, Theme Toggling, Tabs & Sidebar
 */

// Dataset of articles for link previews and search
const wikiKnowledgeBase = {
  "Anfield": {
    title: "Anfield",
    extract: "Anfield is a football stadium in Anfield, Liverpool, Merseyside, England, which has a seating capacity of 61,276, making it the fifth largest football stadium in England. It has been the home of Liverpool F.C. since their formation in 1892.",
    image: "assets/anfield.jpg"
  },
  "Liverpool F.C.": {
    title: "Liverpool F.C.",
    extract: "Liverpool Football Club is a professional football club based in Liverpool, England. The club competes in the Premier League, the top tier of English football, having won 19 League titles and 6 European Cups.",
    image: "assets/anfield.jpg"
  },
  "Harald V of Norway": {
    title: "Harald V of Norway",
    extract: "Harald V (born 21 February 1937) is the King of Norway, having acceded to the throne on 17 January 1991. He is the son of King Olav V and Crown Princess Märtha of Sweden.",
    image: "assets/haakon.jpg"
  },
  "Haakon VIII of Norway": {
    title: "Haakon VIII of Norway",
    extract: "Haakon VIII is the King of Norway, succeeding his father Harald V. He is a member of the House of Glücksburg and served as Crown Prince prior to his accession.",
    image: "assets/haakon.jpg"
  },
  "Yayoi Kusama": {
    title: "Yayoi Kusama",
    extract: "Yayoi Kusama is a Japanese contemporary artist who worked primarily in sculpture and installation, and was also active in painting, performance, video art, and fashion, famous for her infinity mirror rooms and polka dots.",
    image: ""
  },
  "Masai Russell": {
    title: "Masai Russell",
    extract: "Masai Russell is an American track and field athlete who specializes in the 100-meter hurdles. She is an Olympic gold medalist and world record holder.",
    image: ""
  },
  "Alison dos Santos": {
    title: "Alison dos Santos",
    extract: "Alison Brendom Alves dos Santos is a Brazilian track and field athlete specializing in the 400-meter hurdles. He won the 2022 World Championship and is a multiple Olympic medalist.",
    image: ""
  },
  "Everton F.C.": {
    title: "Everton F.C.",
    extract: "Everton Football Club is an English professional football club based in Liverpool that competes in the Premier League. The club has competed in the top division for a record 121 seasons.",
    image: ""
  },
  "Goodison Park": {
    title: "Goodison Park",
    extract: "Goodison Park is a football stadium in the Walton area of Liverpool, England. It has been the home stadium of Premier League club Everton F.C. since its completion in 1892.",
    image: ""
  },
  "Taylor Report": {
    title: "Taylor Report",
    extract: "The Taylor Report is a document overseen by Lord Taylor of Gosforth into the causes of the Hillsborough disaster of 1989, recommending that all major stadiums become all-seater.",
    image: ""
  },
  "Bill Shankly": {
    title: "Bill Shankly",
    extract: "William Shankly OBE was a Scottish football player and manager, best known for his management of Liverpool between 1959 and 1974, leading them to numerous major honors.",
    image: ""
  },
  "Bob Paisley": {
    title: "Bob Paisley",
    extract: "Robert Paisley OBE was an English football manager and player who spent almost 50 years with Liverpool F.C. as a player, coach, and manager, winning three European Cups.",
    image: ""
  },
  "Spion Kop (stadiums)": {
    title: "Spion Kop",
    extract: "Spion Kop (or Kop for short) is a colloquial name or term for a number of single-tier terraces and stands at sports stadiums, particularly in the United Kingdom, named after the Battle of Spion Kop.",
    image: ""
  },
  "Wolverhampton Wanderers F.C.": {
    title: "Wolverhampton Wanderers F.C.",
    extract: "Wolverhampton Wanderers Football Club, commonly known as Wolves, is a professional association football club based in Wolverhampton, West Midlands, England.",
    image: ""
  },
  "Wikipedia": {
    title: "Wikipedia",
    extract: "Wikipedia is a free, multilingual open-collaborative online encyclopedia written and maintained by a community of volunteer contributors through a model of open collaboration.",
    image: ""
  },
  "James Webb Space Telescope": {
    title: "James Webb Space Telescope",
    extract: "The James Webb Space Telescope (JWST) is a space telescope designed primarily to conduct infrared astronomy. As the largest optical telescope in space, its high resolution and sensitivity allow it to view deep space objects.",
    image: ""
  },
  "Antikythera mechanism": {
    title: "Antikythera mechanism",
    extract: "The Antikythera mechanism is an Ancient Greek hand-powered orrery, described as the oldest known example of an analogue computer, used to predict astronomical positions and eclipses.",
    image: ""
  },
  "Great Kantō earthquake": {
    title: "1923 Great Kantō earthquake",
    extract: "The Great Kantō earthquake struck the Kantō Plain on the main Japanese island of Honshu at 11:58:44 JST on Saturday, September 1, 1923, causing immense destruction in Tokyo and Yokohama.",
    image: ""
  }
};

document.addEventListener('DOMContentLoaded', () => {
  initLinkPreviews();
  initSearchAutocomplete();
  initSidebar();
  initThemeToggle();
  initActionTabs();
  initRandomArticle();
});

/* ==========================================================================
   1. Wikipedia Link Hover Preview (Page Previews)
   ========================================================================== */
function initLinkPreviews() {
  const previewCard = document.getElementById('wiki-preview-card');
  const previewImgWrap = document.getElementById('preview-image-wrap');
  const previewImg = document.getElementById('preview-image');
  const previewTitle = document.getElementById('preview-title');
  const previewExtract = document.getElementById('preview-extract');

  let hoverTimeout = null;
  let hideTimeout = null;

  const links = document.querySelectorAll('.wiki-link');

  links.forEach(link => {
    link.addEventListener('mouseenter', (e) => {
      clearTimeout(hideTimeout);
      const title = link.getAttribute('data-title') || link.innerText.trim();
      const article = wikiKnowledgeBase[title] || {
        title: title,
        extract: `${title} is a topic on Wikipedia. Click to read the full encyclopedic entry and historical sources.`,
        image: ''
      };

      hoverTimeout = setTimeout(() => {
        showPreview(e.target, article);
      }, 280);
    });

    link.addEventListener('mouseleave', () => {
      clearTimeout(hoverTimeout);
      hideTimeout = setTimeout(() => {
        hidePreview();
      }, 220);
    });
  });

  previewCard.addEventListener('mouseenter', () => {
    clearTimeout(hideTimeout);
  });

  previewCard.addEventListener('mouseleave', () => {
    hideTimeout = setTimeout(() => {
      hidePreview();
    }, 220);
  });

  function showPreview(targetEl, data) {
    previewTitle.textContent = data.title;
    previewExtract.textContent = data.extract;

    if (data.image) {
      previewImg.src = data.image;
      previewImgWrap.style.display = 'block';
    } else {
      previewImgWrap.style.display = 'none';
    }

    const rect = targetEl.getBoundingClientRect();
    const cardWidth = 320;
    let left = rect.left + window.scrollX;
    let top = rect.bottom + window.scrollY + 8;

    // Boundary check right
    if (left + cardWidth > window.innerWidth - 20) {
      left = window.innerWidth - cardWidth - 20;
    }

    previewCard.style.left = `${left}px`;
    previewCard.style.top = `${top}px`;
    previewCard.style.display = 'block';
  }

  function hidePreview() {
    previewCard.style.display = 'none';
  }
}

/* ==========================================================================
   2. Live Search Autocomplete
   ========================================================================== */
function initSearchAutocomplete() {
  const searchInput = document.getElementById('search-input');
  const searchDropdown = document.getElementById('search-dropdown');
  const searchResultsList = document.getElementById('search-results-list');
  const searchSubmitBtn = document.getElementById('search-submit-btn');

  const searchEntries = Object.keys(wikiKnowledgeBase).map(key => ({
    title: wikiKnowledgeBase[key].title,
    desc: wikiKnowledgeBase[key].extract.substring(0, 75) + '...',
    image: wikiKnowledgeBase[key].image || ''
  }));

  searchInput.addEventListener('input', (e) => {
    const val = e.target.value.trim().toLowerCase();
    if (!val) {
      searchDropdown.classList.remove('active');
      return;
    }

    const matched = searchEntries.filter(item =>
      item.title.toLowerCase().includes(val) || item.desc.toLowerCase().includes(val)
    );

    if (matched.length === 0) {
      searchResultsList.innerHTML = `
        <li class="search-result-item" style="color: var(--wiki-text-muted); cursor: default;">
          No articles matching "<strong>${escapeHtml(val)}</strong>"
        </li>
      `;
    } else {
      searchResultsList.innerHTML = matched.slice(0, 6).map(item => `
        <li class="search-result-item" data-title="${escapeHtml(item.title)}">
          ${item.image ? `<img src="${item.image}" class="search-result-thumb" alt="" />` : `<div class="search-result-thumb" style="display:flex;align-items:center;justify-content:center;color:#666;font-size:16px;">📄</div>`}
          <div class="search-result-info">
            <div class="search-result-title">${highlightMatch(item.title, val)}</div>
            <div class="search-result-desc">${item.desc}</div>
          </div>
        </li>
      `).join('');
    }

    searchDropdown.classList.add('active');
  });

  // Handle clicking search result
  searchResultsList.addEventListener('click', (e) => {
    const item = e.target.closest('.search-result-item');
    if (item && item.dataset.title) {
      const title = item.dataset.title;
      searchInput.value = title;
      searchDropdown.classList.remove('active');
      showModal(title, wikiKnowledgeBase[title] ? wikiKnowledgeBase[title].extract : `You searched for ${title}`);
    }
  });

  // Close dropdown on click outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#search-container')) {
      searchDropdown.classList.remove('active');
    }
  });

  searchSubmitBtn.addEventListener('click', () => {
    if (searchInput.value.trim()) {
      showModal(`Search: ${searchInput.value}`, `Showing search results for "${searchInput.value}".`);
    }
  });

  function highlightMatch(text, query) {
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<strong>$1</strong>');
  }

  function escapeHtml(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}

/* ==========================================================================
   3. Sidebar Navigation Drawer
   ========================================================================== */
function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const menuToggle = document.getElementById('menu-toggle-btn');
  const closeBtn = document.getElementById('sidebar-close-btn');

  function openSidebar() {
    sidebar.classList.add('open');
    overlay.classList.add('active');
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
  }

  menuToggle.addEventListener('click', openSidebar);
  closeBtn.addEventListener('click', closeSidebar);
  overlay.addEventListener('click', closeSidebar);
}

/* ==========================================================================
   4. Theme Toggle (Light / Dark Mode)
   ========================================================================== */
function initThemeToggle() {
  const themeBtn = document.getElementById('theme-toggle');
  const savedTheme = localStorage.getItem('wiki-theme') || 'light';

  if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
    updateThemeBtn(true);
  }

  themeBtn.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('wiki-theme', isDark ? 'dark' : 'light');
    updateThemeBtn(isDark);
  });

  function updateThemeBtn(isDark) {
    const icon = themeBtn.querySelector('.theme-icon');
    const text = themeBtn.querySelector('.theme-text');
    if (isDark) {
      icon.textContent = '☀️';
      text.textContent = 'Switch to Light Mode';
    } else {
      icon.textContent = '🌙';
      text.textContent = 'Toggle Dark Mode';
    }
  }
}

/* ==========================================================================
   5. Action Tabs & More Dropdown
   ========================================================================== */
function initActionTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  const moreBtn = document.getElementById('more-actions-btn');
  const moreMenu = document.getElementById('more-actions-menu');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const parent = tab.parentElement;
      parent.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const tabName = tab.getAttribute('data-tab');
      if (tabName === 'talk') {
        showModal('Talk: Main Page', 'Welcome to the discussion page for the Main Page. Here editors collaborate on featured content, anniversaries, and site design.');
      } else if (tabName === 'view-source') {
        showModal('View source: Main Page', '<p>You do not have permission to edit this page, for the following reason:</p><blockquote>The action you have requested is limited to users in the group: Administrators.</blockquote>');
      } else if (tabName === 'view-history') {
        showModal('Revision history of Main Page', '<p>Displaying recent edits by administrators and automated bot maintenance.</p>');
      }
    });
  });

  // More Actions dropdown toggle
  moreBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    moreMenu.classList.toggle('active');
  });

  document.addEventListener('click', () => {
    moreMenu.classList.remove('active');
  });

  // Modal close handlers
  const modal = document.getElementById('action-modal');
  const modalClose = document.getElementById('modal-close-btn');

  modalClose.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });
}

function showModal(title, content) {
  const modal = document.getElementById('action-modal');
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = content;
  modal.style.display = 'flex';
}

/* ==========================================================================
   6. Random Article Logic
   ========================================================================== */
function initRandomArticle() {
  const randomBtn = document.getElementById('random-article-btn');
  randomBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const keys = Object.keys(wikiKnowledgeBase);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    const article = wikiKnowledgeBase[randomKey];
    showModal(`🎲 Random Article: ${article.title}`, `
      ${article.image ? `<img src="${article.image}" style="max-width:100%; border-radius:4px; margin-bottom:12px;" />` : ''}
      <p>${article.extract}</p>
    `);
  });
}
