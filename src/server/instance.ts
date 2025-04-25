import { Instance, NetworkEvent, AABB2D, ChannelAABB2D, Channel, User } from 'nengi'
import { ncontext } from '../common/ncontext'
import { NType } from '../common/NType'
import { uWebSocketsInstanceAdapter } from 'nengi-uws-instance-adapter'
import { BufferWriter } from 'nengi-buffers'

const instance = new Instance(ncontext)
const port = 9001
const uws = new uWebSocketsInstanceAdapter(instance.network, { /* uws config */ })
uws.listen(port, () => { console.log(`uws adapter is listening on ${port}`) })
// @ts-ignore
//instance.network.registerNetworkAdapter(uws)

// a plain channel (everyone sees everything in it)
const main = new Channel(instance.localState)
// @ts-ignore
//instance.registerChannel(main)

// a spatial channel (users have a view and see positional objects within their view)
const space = new ChannelAABB2D(instance.localState)
// @ts-ignore
//instance.registerChannel(space)

// mocks hitting an external service to authenticate a user
instance.onConnect = async (handshake: any) => {
    console.log('handshake received')
    return true
}

instance.network.onOpen = (user) => {
    console.log('user connected')
}

const queue = instance.queue

const update = () => {
    while (!queue.isEmpty()) {
        // get the next event from the queue
        const networkEvent = queue.next()

        // handle a user disconnecting
        if (networkEvent.type === NetworkEvent.UserDisconnected) {
            const { user } = networkEvent
            console.log('user disconnected')
        }

        // handle a user connecting
        if (networkEvent.type === NetworkEvent.UserConnected) {
            const { user } = networkEvent

            // handle connection here... for example:
            main.subscribe(user)
            // @ts-ignore
            user.view = new AABB2D(0, 0, 2200, 2200)
            // @ts-ignore
            space.subscribe(networkEvent.user, user.view)
            
            // could be a class, too, the important part is `ntype`
            const playerEntity = { nid: 0, ntype: NType.Entity, x: 50, y: 50 }
            main.addEntity(playerEntity)
            user.queueMessage({ myId: playerEntity.nid, ntype: NType.IdentityMessage })
            console.log('user connected')
        }

        
        //console.log('network event', networkEvent)
        // @ts-ignore
        if (networkEvent.type === NType.Command) {
            console.log('command received')
            console.log(networkEvent)
            const { user, commands } = networkEvent
            console.log(commands)
            //if (command.ntype === NType.Command) {
            //    console.log('received command:', command)
            //}
        }
    }
    instance.step()
}

setInterval(() => {
    update()
}, 50)