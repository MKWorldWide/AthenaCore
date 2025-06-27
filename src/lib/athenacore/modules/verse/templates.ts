/**
 * @file AthenaCore Verse Templates
 * @description Common Verse code patterns and templates for UEFN development
 * @author Sunny & Mrs. K
 * @version 1.0.0
 */

/**
 * @interface VerseTemplate
 * @description Structure for a Verse code template
 */
export interface VerseTemplate {
  name: string;
  description: string;
  imports: string[];
  code: string;
  examples: string[];
  metadata: {
    complexity: number;
    performance: number;
    maintainability: number;
    tags: string[];
  };
}

/**
 * @constant verseTemplates
 * @description Collection of common Verse code templates
 */
export const verseTemplates: Record<string, VerseTemplate> = {
  countdown: {
    name: 'Countdown Timer',
    description: 'A simple countdown timer that triggers an event when it reaches zero',
    imports: ['/Verse.org/Simulation', '/Fortnite.com/Devices'],
    code: `
using { /Verse.org/Simulation }
using { /Fortnite.com/Devices }

countdown := class():
    var Timer: float = 5.0
    var ExplodeEvent: event()

    update() =>
        loop:
            Sleep(1.0)
            Timer -= 1.0
            if (Timer <= 0.0):
                ExplodeEvent.Trigger()
                break
    `,
    examples: [
      'Create a 10-second countdown before starting a game',
      'Trigger an explosion after a 5-second delay',
      'Create a respawn timer for eliminated players'
    ],
    metadata: {
      complexity: 0.3,
      performance: 0.9,
      maintainability: 0.8,
      tags: ['timer', 'event', 'gameplay']
    }
  },

  playerMovement: {
    name: 'Player Movement',
    description: 'Basic player movement controls with speed and direction',
    imports: ['/Verse.org/Simulation', '/Fortnite.com/Devices', '/Fortnite.com/Agents'],
    code: `
using { /Verse.org/Simulation }
using { /Fortnite.com/Devices }
using { /Fortnite.com/Agents }

player_movement := class():
    var Speed: float = 1000.0
    var Direction: vector3 = vector3(0.0, 0.0, 0.0)
    var Player: agent = agent{}

    update() =>
        loop:
            if (Player.IsValid()):
                Player.Move(Direction * Speed * GetDeltaTime())
            Sleep(0.016) # ~60 FPS
    `,
    examples: [
      'Implement basic WASD movement controls',
      'Create a flying character with custom movement',
      'Add sprint functionality to player movement'
    ],
    metadata: {
      complexity: 0.4,
      performance: 0.8,
      maintainability: 0.7,
      tags: ['movement', 'player', 'controls']
    }
  },

  inventory: {
    name: 'Inventory System',
    description: 'Basic inventory system with items and slots',
    imports: ['/Verse.org/Simulation', '/Fortnite.com/Devices'],
    code: `
using { /Verse.org/Simulation }
using { /Fortnite.com/Devices }

item := class():
    var Name: string = ""
    var Description: string = ""
    var Quantity: int = 1

inventory := class():
    var Items: array{item} = array{}
    var MaxSlots: int = 10

    add_item(new_item: item) =>
        if (Items.Length < MaxSlots):
            Items.Add(new_item)
            return true
        return false

    remove_item(index: int) =>
        if (index >= 0 and index < Items.Length):
            Items.RemoveAt(index)
            return true
        return false
    `,
    examples: [
      'Create a player inventory with 10 slots',
      'Implement item pickup and drop functionality',
      'Add item stacking and quantity management'
    ],
    metadata: {
      complexity: 0.5,
      performance: 0.7,
      maintainability: 0.8,
      tags: ['inventory', 'items', 'management']
    }
  },

  gameState: {
    name: 'Game State Manager',
    description: 'Manages game states and transitions',
    imports: ['/Verse.org/Simulation', '/Fortnite.com/Devices'],
    code: `
using { /Verse.org/Simulation }
using { /Fortnite.com/Devices }

game_state := class():
    var CurrentState: string = "waiting"
    var StateChanged: event(string)
    var States: array{string} = array{"waiting", "playing", "paused", "ended"}

    change_state(new_state: string) =>
        if (States.Contains(new_state)):
            CurrentState = new_state
            StateChanged.Trigger(new_state)
            return true
        return false

    is_state(state: string) =>
        return CurrentState = state
    `,
    examples: [
      'Implement a game lobby system',
      'Create a pause menu functionality',
      'Add game over and restart logic'
    ],
    metadata: {
      complexity: 0.4,
      performance: 0.9,
      maintainability: 0.8,
      tags: ['state', 'management', 'gameplay']
    }
  },

  spawnSystem: {
    name: 'Spawn System',
    description: 'Manages entity spawning with randomization',
    imports: ['/Verse.org/Simulation', '/Fortnite.com/Devices'],
    code: `
using { /Verse.org/Simulation }
using { /Fortnite.com/Devices }

spawn_point := class():
    var Position: vector3 = vector3(0.0, 0.0, 0.0)
    var Rotation: rotator = rotator(0.0, 0.0, 0.0)
    var IsOccupied: logic = false

spawn_system := class():
    var SpawnPoints: array{spawn_point} = array{}
    var SpawnInterval: float = 5.0
    var LastSpawnTime: float = 0.0

    add_spawn_point(point: spawn_point) =>
        SpawnPoints.Add(point)

    spawn_entity() =>
        if (SpawnPoints.Length > 0):
            var available_points = SpawnPoints.Filter(p => not p.IsOccupied)
            if (available_points.Length > 0):
                var random_index = GetRandomInt(0, available_points.Length - 1)
                var point = available_points[random_index]
                point.IsOccupied = true
                return point
        return spawn_point{}
    `,
    examples: [
      'Create random enemy spawns in a game',
      'Implement player respawn points',
      'Add item spawn system with randomization'
    ],
    metadata: {
      complexity: 0.6,
      performance: 0.8,
      maintainability: 0.7,
      tags: ['spawn', 'random', 'entities']
    }
  }
}; 