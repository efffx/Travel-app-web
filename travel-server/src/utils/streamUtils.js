export const createStreamResponse = (res) => {
    //设置响应头
    res.setHeader('Content-Type', 'text/event-stream');
    //确保浏览器缓存不使用旧数据
    res.setHeader('Cache-Control', 'no-cache');
    //确保浏览器不关闭连接
    res.setHeader('Connection', 'keep-alive');
    return {
        send:(data) => {
            try {
                res.write(`data: ${JSON.stringify(data)}\n\n`)
            } catch (error) {
                console.error('发送数据到流时出错:', error);
            }
        },
        end:() => {
           try {
                res.write('event: end\ndata: {"done":true}\n\n')
                res.end()
           } catch (error) {
                console.error('结束流时出错:', error);
           }
        
        }, 
        error:(message) => {
            try {
                res.write(`data: ${JSON.stringify(message)}\n\n`)
                res.end()
            } catch (error) {
                console.error('流式接口发送数据时出错:', error);
            }
        },
    }
}