import { Instance, NetworkEvent, AABB2D, ChannelAABB2D, Channel } from 'nengi'
import { ncontext } from '../common/ncontext'
import { NType } from '../common/NType'
import { uWebSocketsInstanceAdapter } from 'nengi-uws-instance-adapter'
import { BufferWriter } from 'nengi-buffers'


const instance = new Instance(ncontext)
const port = 9001
const uws = new uWebSocketsInstanceAdapter(instance.network, { /* uws config */ })
uws.listen(port, () => { console.log(`uws adapter is listening on ${port}`) })
//instance.network.registerNetworkAdapter(uws)

// a plain channel (everyone sees everything in it)
const main = new Channel(instance.localState)
//instance.registerChannel(main)

// a spatial channel (users have a view and see positional objects within their view)
const space = new ChannelAABB2D(instance.localState)
//instance.registerChannel(space)

//const queue = instance.network.queue

const update = () => {
    /*while (!queue.isEmpty()) {
        const networkEvent = queue.next()

        if (networkEvent.type === NetworkEvent.UserDisconnected) {
            const { user } = networkEvent
            // handle disconnection here...
        }

        if (networkEvent.type === NetworkEvent.UserConnected) {
            const { user } = networkEvent
            // handle connection here... for example:
            main.subscribe(user)
            // @ts-ignore
            user.view = new ViewAABB(0, 0, 2200, 2200)
            // @ts-ignore
            space.subscribe(networkEvent.user, user.view)

            // could be a class, too, the important part is `ntype`
            const playerEntity = { nid: 0, ntype: NType.Entity, x: 50, y: 50 }
            main.addEntity(playerEntity)
            user.queueMessage({ myId: playerEntity.nid, ntype: NType.IdentityMessage })
        }

        if (networkEvent.type === NetworkEvent.Command) {
            const { user, command } = networkEvent.user

            // if (command.ntype === NType.Command) {
            //     const { w, a, s, d, delta } = command
            //     // do something with WASD
            // }
        }
    }*/
    instance.step()
}

setInterval(() => {
    update()
}, 50)