// Simple test to check if basic functionality works
console.log('🧪 Test script loaded!');

document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM Content Loaded');
    
    const tabButtons = document.querySelectorAll('.tab-btn');
    console.log(`Found ${tabButtons.length} tab buttons`);
    
    tabButtons.forEach((btn, index) => {
        const tabName = btn.getAttribute('data-tab');
        console.log(`Button ${index}: ${tabName}`);
        
        btn.addEventListener('click', () => {
            console.log(`Clicked: ${tabName}`);
            
            // Hide all tabs
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.add('hidden');
            });
            
            // Show selected tab
            const selectedTab = document.getElementById(`${tabName}-tab`);
            if (selectedTab) {
                selectedTab.classList.remove('hidden');
                console.log(`✅ Showed tab: ${tabName}`);
            } else {
                console.error(`❌ Tab not found: ${tabName}-tab`);
            }
            
            // Update button states
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    console.log('✅ Simple test script initialized!');
});
