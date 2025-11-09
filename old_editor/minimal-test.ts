// Minimal test - no external imports
console.log('🧪 Minimal test loaded');

document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM loaded');
    
    const buttons = document.querySelectorAll('.tab-btn');
    console.log(`Found ${buttons.length} buttons`);
    
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-tab');
            console.log(`Clicked: ${tab}`);
            
            // Hide all
            document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
            // Show selected
            document.getElementById(`${tab}-tab`)?.classList.remove('hidden');
            // Update buttons
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            console.log(`✅ Switched to ${tab}`);
        });
    });
    
    console.log('✅ Minimal test ready');
});
