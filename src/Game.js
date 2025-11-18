import { Group, Box3, MeshPhongMaterial, Mesh, SphereGeometry } from 'three';

import Road from './environment/Road.js';
import Player from './objects/Player.js';
import Water from './environment/Water.js';
import Clouds from './environment/Clouds.js';
import Collectables from './objects/Collectables.js';

const score = document.querySelector('#scoreAmount');

class Game extends Group {
  static road;
  static water;
  static clouds;
  static player;
  static numberOfMoney;
  static isDown;
  static rollingStarted;
  static speed;
  static collectables;
  static particles;

  constructor() {
    super();

    this.speed = 0.1;
    this.road = new Road();
    this.water = new Water();
    this.clouds = new Clouds();
    this.player = new Player();
    this.collectables = new Collectables();
    this.numberOfCollectables = 30;
    this.particles = [];

    this.add(this.road);
    this.add(this.water);
    this.add(this.clouds);
    this.add(this.player);
    this.add(this.collectables);

    this.generateCollectables();
  }

  onMove(x, isMobile) {
    if (this.isDown) {
      this.player.position.x = !isMobile ? x * 2 : x * 0.5;
    }
  }

  onDown() {
    this.isDown = true;
    if (!this.rollingStarted) {
      this.rollingStarted = true;
      this.road.updateRoad(this.speed);
      this.water.updateWater(this.speed);
      const animate = () => {
        requestAnimationFrame(animate);

        // Update collectables
        this.collectables.updateCollectables(this.speed);

        // Detect collision between player and collectables
        this.detectCollision();

        // Restrict player movement to the road
        this.playerMovementRestriction();

        // Flash the player if out of bounds
        this.flashPlayerIfOutOfBounds();

        // Check if some particles are out of bounds and remove them
        this.removeParticlesIfOutOfBounds();
      }

      animate();
    }
  }

  onUp() {
    this.isDown = false;
  }

  playerMovementRestriction() {
    const playerPosition = this.player.position.x;
    const roadPosition = this.road.position.x;
    const difference = playerPosition - roadPosition;
    const rotation = difference * 0.5;
    this.player.rotation.z = rotation;

    if (playerPosition < -0.85 || playerPosition > 0.85) {
      this.player.position.y -= 0.1;
      this.player.position.z -= 0.05;
    }
  }

  generateCollectables() {
    for (let i = 0; i < this.numberOfCollectables; i++) {
      this.collectables.addCollectable();
    }

  }

  addParticles(color) {
    const particleGeometry = new SphereGeometry(0.1, 0.1, 0.1);
    const particleMaterial = new MeshPhongMaterial({
      color,
    });

    for (let i = 0; i < 10; i++) {
      const particle = new Mesh(particleGeometry, particleMaterial);
      particle.position.set(this.player.position.x, -1, this.player.position.z);
      particle.castShadow = true;
      this.particles.push(particle);
      this.add(particle);
    }

    const animate = () => {
      requestAnimationFrame(animate);
      this.particles.forEach((particle) => {
        particle.position.y += 0.1;
        particle.position.x += (Math.random() * 0.1) - 0.05;
        particle.position.z += (Math.random() * 0.1) - 0.05;
        particle.rotation.x += 0.1;
        particle.rotation.y += 0.1;
        particle.rotation.z += 0.1;
        particle.material.opacity -= 0.01;
      });
    };

    animate();
  }

  removeParticlesIfOutOfBounds() {
    this.particles.forEach((particle) => {
      if (particle.position.y > 40) {
        this.remove(particle);
        this.particles.splice(this.particles.indexOf(particle), 1);
      }
    });
  }

  detectCollision() {
    const playerBoundingBox = new Box3().setFromObject(this.player);
    const collectablesBoundingBoxes = this.collectables.objects.map((obj) => {
      return new Box3().setFromObject(obj.collectable);
    });
    for (let i = 0; i < collectablesBoundingBoxes.length; i++) {
      const collectableBoundingBox = collectablesBoundingBoxes[i];
      const object = this.collectables.objects[i];
      if (playerBoundingBox.intersectsBox(collectableBoundingBox)) {
        score.innerHTML = parseInt(score.innerHTML) + (object.isBad ? -1 : 1);
        object.collectable.position.y += 30;
        object.collectable.position.x = (Math.random() * 3) - 1.5;

        this.addParticles(object.isBad ? 0xff0000 : 0x00ff00);

        const tint = setInterval(() => {
          if (object.isBad) {
            this.player.traverse((child) => {
              if (child.isMesh) {
                child.material.color.setHex(0xff0000);
              }
            });
          } else {
            this.player.traverse((child) => {
              if (child.isMesh) {
                child.material.color.setHex(0x00ff00);
              }
            });
          }
        }, 100);

        setTimeout(() => {
          clearInterval(tint);
          this.player.traverse((child) => {
            if (child.isMesh) {
              child.material.color.setHex(0xffffff);
            }
          });
        }, 500);
      }
    }
  }

  flashPlayerIfOutOfBounds() {    
    if (this.player.position.y > -1) {
      return;
    }
    
    this.isDown && this.onUp()
    this.player.position.set(0, 0, 0);
    const flash = setInterval(() => {
      this.player.visible = !this.player.visible;
    }, 100);
    setTimeout(() => {
      clearInterval(flash);
      this.player.visible = true;
    }, 1000);
  }
}

export default Game;