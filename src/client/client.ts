import { Client, Interpolator } from 'nengi'
import { ncontext } from '@/common/ncontext'
import { NType } from '@/common/NType'
import { WebSocketClientAdapter } from 'nengi-websocket-client-adapter'

window.addEventListener('load', async () => {
    console.log('window loaded!')

    const serverTickRate = 20 // 20 ticks per second
    const client = new Client(ncontext, WebSocketClientAdapter, serverTickRate)
    const interpolator = new Interpolator(client)
    try {
        const res = await client.connect('ws://localhost:9001', { token: 12345 })
        console.log('Connected successfully:', res)
    } catch (err) {
        console.log('connection error', err)
        return // Don't continue if connection failed
    }

    const tick = (delta: number) => {
        const istate = interpolator.getInterpolatedState(100 /* interp delay */)

        while (client.network.messages.length > 0) {
            const message = client.network.messages.pop()
            console.log('Received message:', message)
        }

        istate.forEach(snapshot => {
            snapshot.createEntities.forEach((entity: any) => {
                // TODO create new entity on the client
            })

            snapshot.updateEntities.forEach((diff: any) => {
                // TODO update existing entity
            })

            snapshot.deleteEntities.forEach((nid: number) => {
                // TODO remove existing entity
            })
        })

        // send command to server (hypothetical)
        // const { w, a, s, d } = inputState
        client.addCommand({ ntype: NType.Command, w: true, a: true, s: true, d: true, delta })
        client.addCommand({ ntype: NType.Command, w: false, a: false, s: false, d: false, delta })
        client.flush()
    }

    // a standard rAF loop
    let prev = performance.now()
    const loop = () => {
        window.requestAnimationFrame(loop)
        const now = performance.now()
        const delta = (now - prev) / 1000
        prev = now
        // probably missing "if (connected)..."
        tick(delta)
    }

    // start the loop
    loop()
})