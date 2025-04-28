import { Instance, NetworkEvent, AABB2D, ChannelAABB2D, Channel } from 'nengi'
import { ncontext } from '../common/ncontext'
import { NType } from '../common/NType'
import { uWebSocketsInstanceAdapter } from 'nengi-uws-instance-adapter'

const port = 9001
const instance = new Instance(ncontext)
const uws = new uWebSocketsInstanceAdapter(instance.network, { /* uws config */ })
uws.listen(port, () => { console.log(`uws adapter is listening on ${port}`) })


// a plain channel (everyone sees everything in it)
const main = new Channel(instance.localState)

// a spatial channel (users have a view and see positional objects within their view)
const space = new ChannelAABB2D(instance.localState)

instance.onConnect = async (handshake: any) => {
    console.log('handshake received', handshake.token)
    return true
}

const queue = instance.queue

const update = () => {
    while (!queue.isEmpty()) {
        // get the next event from the queue
        const networkEvent = queue.next()

        // handle a user disconnecting
        if (networkEvent.type === NetworkEvent.UserDisconnected) {
            const { user } = networkEvent
            console.log('user disconnected', user.id)
        }

        // handle a user connecting
        if (networkEvent.type === NetworkEvent.UserConnected) {
            const { user } = networkEvent

            // handle connection here... for example:
            main.subscribe(user)
            const viewSize = 2200
            // @ts-expect-error user view not typed
            user.view = new AABB2D(0, 0, viewSize, viewSize)
            // @ts-expect-error user view not typed
            space.subscribe(networkEvent.user, user.view)

            //generate a random color
            const color = Math.random() * 0xFFFFFF
            
            const playerEntity = { 
                nid: 0, 
                ntype: NType.Entity, 
                x: 700,
                y: 400,
                color: color,
                username: 'J'
            }

            main.addEntity(playerEntity)
            space.addEntity(playerEntity)
            user.queueMessage({ myId: playerEntity.nid, ntype: NType.IdentityMessage })
            console.log('user connected', playerEntity.nid)
            
        }

        if (networkEvent.type === NetworkEvent.CommandSet) {
            const { commands } = networkEvent
            if(commands.length > 0) {
                commands.forEach((command: any) => {
                    if (command.ntype === NType.Command) {
                        console.log('command', command)
                    }
                })
            }
        }
    }
    instance.step()
}

setInterval(() => {
    update()
}, 50)