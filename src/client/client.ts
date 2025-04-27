import { Client, Interpolator } from 'nengi'
import { Application, Graphics } from 'pixi.js';
import { ncontext } from '@/common/ncontext'
import { NType } from '@/common/NType'
import { WebSocketClientAdapter } from 'nengi-websocket-client-adapter'

const createNotificationBox = () => {
    const notificationBox = document.createElement('div')
    notificationBox.style.position = 'fixed'
    notificationBox.style.top = '10px'
    notificationBox.style.right = '10px'
    notificationBox.style.width = '300px'
    notificationBox.style.maxHeight = '500px'
    notificationBox.style.overflowY = 'auto'
    notificationBox.style.backgroundColor = 'rgba(0,0,0,0.8)'
    notificationBox.style.color = 'white'
    notificationBox.style.padding = '10px'
    notificationBox.style.borderRadius = '2px'
    notificationBox.style.fontFamily = 'monospace'
    notificationBox.style.fontSize = '10px'
    notificationBox.style.zIndex = '1000'
    document.body.appendChild(notificationBox)
    return notificationBox
}

const addNotification = (box: HTMLDivElement, message: string) => {
    const notification = document.createElement('div')
    notification.textContent = message
    notification.style.borderBottom = '1px solid rgba(255,255,255,0.2)'
    notification.style.padding = '5px 0'
    box.appendChild(notification)
    box.scrollTop = box.scrollHeight
}

const createPlayer = (entity: any, app: Application) => {
    const player = new Graphics()
        .circle(0, 0, 10)
        .fill({ color: 0xffffff, alpha: 1 })
    player.x = entity.x
    player.y = entity.y
    app.stage.addChild(player)
}


window.addEventListener('load', async () => {

    const app = new Application()
    await app.init({ 
        antialias: true,
        background: '#000000', 
        resolution: window.devicePixelRatio,
        autoDensity: true,
        resizeTo: window,
    });
    document.body.appendChild(app.canvas);

    const notificationBox = createNotificationBox()
    addNotification(notificationBox, 'Window loaded')

    const serverTickRate = 20 // 20 ticks per second
    const client = new Client(ncontext, WebSocketClientAdapter, serverTickRate)
    const interpolator = new Interpolator(client)

    let sendCommand = false
    setTimeout(() => {
        sendCommand = true
    }, 2000)
   
    try {
        const res = await client.connect('ws://localhost:9001', { token: 12345 })
        if(res==='accepted') {
            addNotification(notificationBox, 'Connected to server')
        } else {
            console.log(res)
            addNotification(notificationBox, 'Connection error: ' + res)
        }
    } catch (err) {
        console.log(err)
        addNotification(notificationBox, 'Connection error: ' + err)
        return
    }

    const tick = (delta: number) => {
        const istate = interpolator.getInterpolatedState(100)

        while (client.network.messages.length > 0) {
            const message = client.network.messages.pop()
            console.log('Received message:', message)
        }

        istate.forEach(snapshot => {
            snapshot.createEntities.forEach((entity: any) => {
                console.log('createEntities', entity)
                createPlayer(entity, app)

                // TODO create new entity on the client
            })

            snapshot.updateEntities.forEach((diff: any) => {
                console.log('updateEntities', diff)
                // TODO update existing entity
            })

            snapshot.deleteEntities.forEach((nid: number) => {
                console.log('deleteEntities', nid)
                // TODO remove existing entity
            })
        })

        if(sendCommand) {
            addNotification(notificationBox, 'Sending command')
            client.addCommand({ ntype: NType.Command, w: true, a: true, s: true, d: true, delta })
            console.log('Sending command')
            client.flush()
            sendCommand = false
        }

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