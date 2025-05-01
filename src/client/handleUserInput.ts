import { InputSystem } from '@/client/InputSystem';
import { Client } from 'nengi';
import { NType } from '@/common/NType';
import { applyCommand } from '@/common/applyCommand';
import { commandSchema } from '@/common/schemas/commandSchema';
import { Application } from 'pixi.js';
const handleUserInput = (
  inputSystem: InputSystem,
  worldState: any,
  entities: any,
  client: Client,
  app: Application,
  delta: any
) => {
  const input = inputSystem.frameState;
  inputSystem.releaseKeys();

  const { myRawId } = worldState;
  if (myRawId) {
    const myRawEntity = entities.get(myRawId);
    //console.log(myRawEntity);
    //console.log(myRawEntity.position);

    // Convert screen coordinates to world coordinates
    const screenX = inputSystem.currentState.mx;
    const screenY = inputSystem.currentState.my;
    const point = app.stage.toLocal({ x: screenX, y: screenY });
    const dx = point.x - myRawEntity.x;
    const dy = point.y - myRawEntity.y;
    const rotation = Math.atan2(dy, dx);

    if (myRawEntity) {
      const command = {
        ntype: NType.Command,
        nid: myRawEntity.nid,
        w: input.w,
        a: input.a,
        s: input.s,
        d: input.d,
        rotation: rotation,
        delta,
      };
      client.addCommand(command);

      // apply moveCommand  to our local entity
      applyCommand(myRawEntity, command);

      // save the result of applying the command as a prediction
      const prediction = {
        nid: myRawEntity.nid,
        x: myRawEntity.x,
        y: myRawEntity.y,
      };
      client.predictor.addCustom(client.serverTickRate, prediction, ['x', 'y'], commandSchema);

      // also apply the result of the prediction to the graphical entity
      const playerGraphics = entities.get(prediction.nid).graphics;
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
