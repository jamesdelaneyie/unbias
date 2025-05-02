import { Client, Binary } from 'nengi';
import { NType } from '@/common/NType';
import { PlayerEntityMap, MoveCommand } from '@/common/types';
import { applyCommand } from '@/common/applyCommand';
import { commandSchema } from '@/common/schemas/commandSchema';
import { InputSystem } from '@/client/InputSystem';
import { Application } from 'pixi.js';

const handleUserInput = (
  inputSystem: InputSystem,
  worldState: any,
  playerEntities: PlayerEntityMap,
  client: Client,
  app: Application,
  delta: number
) => {
  const input = inputSystem.frameState;
  inputSystem.releaseKeys();

  const { myId } = worldState;
  const myEntity = playerEntities.get(myId);
  if (myEntity) {
    const screenX = inputSystem.currentState.mx;
    const screenY = inputSystem.currentState.my;
    const point = app.stage.toLocal({ x: screenX, y: screenY });
    const dx = point.x - myEntity.x;
    const dy = point.y - myEntity.y;
    const rotation = Math.atan2(dy, dx);

    if (myEntity) {
      const command: MoveCommand = {
        ntype: NType.Command,
        nid: myEntity.nid,
        w: input.w as unknown as Binary.Boolean,
        a: input.a as unknown as Binary.Boolean,
        s: input.s as unknown as Binary.Boolean,
        d: input.d as unknown as Binary.Boolean,
        rotation: rotation,
        delta,
      };
      client.addCommand(command);

      // apply moveCommand  to our local entity
      applyCommand(myEntity, command);

      // save the result of applying the command as a prediction
      const prediction = {
        nid: myEntity.nid,
        x: myEntity.x,
        y: myEntity.y,
      };
      client.predictor.addCustom(client.serverTickRate, prediction, ['x', 'y'], commandSchema);

      // also apply the result of the prediction to the graphical entity
      const playerGraphics = playerEntities.get(prediction.nid)?.graphics;
      if (playerGraphics) {
        playerGraphics.x = prediction.x;
        playerGraphics.y = prediction.y;
        playerGraphics.rotation = rotation;
        //app.stage.pivot.set(playerGraphics.x, playerGraphics.y);
        //app.stage.position.set(app.screen.width / 2, app.screen.height / 2);
      }
    }
  }
};

export { handleUserInput };
