// Character object with properties and methods
const character = {
  name: 'Swamp Beast Diplomat',
  class: 'Druid',
  level: 1,
  health: 100,
  image: 'images/swamp-beast.png',
  attacked() {
    this.health = Math.max(0, this.health - 20);
    updateDisplay();
    if (this.health === 0) {
      showMessage(`${this.name} has died.`);
      // disable attack button when dead
      document.getElementById('attack-btn').disabled = true;
    } else {
      showMessage(`${this.name} took 20 damage.`);
    }
  },
  levelUp() {
    this.level += 1;
    updateDisplay();
    showMessage(`${this.name} reached level ${this.level}!`);
  }
};

// DOM references
const elClass = document.getElementById('char-class');
const elLevel = document.getElementById('char-level');
const elHealth = document.getElementById('char-health');
const elMessage = document.getElementById('message');
const attackBtn = document.getElementById('attack-btn');
const levelUpBtn = document.getElementById('levelup-btn');

// Initialize display
function updateDisplay() {
  elClass.textContent = character.class;
  elLevel.textContent = character.level;
  elHealth.textContent = character.health;
}

// Show user messages (accessible)
function showMessage(text) {
  elMessage.textContent = text;
}

// Event listeners
attackBtn.addEventListener('click', () => character.attacked());
levelUpBtn.addEventListener('click', () => character.levelUp());

// Run initial render
updateDisplay();