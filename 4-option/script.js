const navLinks = document.querySelectorAll('.nav-link');
const categoryTitle = document.getElementById('category-title');
const allGrids = document.querySelectorAll('.project-grid');

navLinks.forEach(link => {
    link.addEventListener('click', function(event) {
        event.preventDefault(); 
        
        const selectedCategory = this.getAttribute('data-category');
        
        // 1. 타이틀 변경
        categoryTitle.textContent = selectedCategory;

        // 2. 모든 목록 숨기기
        allGrids.forEach(grid => {
            grid.style.display = 'none';
        });

        // 3. 선택한 목록만 보여주기
        const activeGrid = document.getElementById('grid-' + selectedCategory);
        if (activeGrid) {
            activeGrid.style.display = 'flex';
        }
    });
});