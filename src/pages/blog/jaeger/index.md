---
title: "Jaeger： 开源、端到端的分布式追踪系统"
date: 2018-12-27 22:16:36
tags:
- tracing
- original
category: programming
cover: jaeger.png
---

背景：互联网的后台架构不断在演变，从单体应用到SOA，从SOA到微服务（从微服务再到Serverless）。采用微服务架构后，应用从原来的单体结构转变成了多个微服务相互协作的分布式架构，而运维和调试一个分布式应用相比单体应用的难度通常有数量级上的差异。

Jaeger是Uber开源的一个分布式追踪系统，受到了Dapper（Google）和 OpenZipkin（Twitter）的启发，用于对基于微服务的分布式系统进行监控和故障排查。

> ##### Traditional monitoring tools such as metrics and distributed logging still have their place, but they often fail to provide visibility across services. This is where distributed tracing thrives.

传统的指标和日志：仍然扮演重要角色，主要用于**服务内**
分布式追踪的作用：提供**跨服务**的可见性，端到端的追踪

尝试解决什么问题：

1. 分布式上下文的传递/传播（**distributed context** propagation）
2. 分布式事务监控（distributed transaction monitoring）
3. **根因分析**（root cause analysis）
   1. LA 和 DomainServer配合
4. 服务依赖分析（service dependency analysis）
5. 性能和延时优化（performance and latency optimization)

### 特性：

- Opentracing兼容的数据模型和标记库（提供Go、Java、Node、Python和**C++ 客户端**实现）
  - **Opentracing 数据模型**（相当于 SamplingEngine 定义的数据结构和埋点 API ）
- 不同服务可设置不同的采样率（Uses consistent upfront sampling with individual per service/endpoint probabilities）
- 支持多个存储后端：**Cassandra**、ElasticSearch、memory
- **适应性采样（coming soon）**
- **数据（收集后）处理流水线（coming soon）**

## Opentracing规范

<https://github.com/opentracing/specification/blob/master/specification.md>

主要包括两个部分：

- 数据模型的定义，规范语义
- 提供9种语言的API接口层，C++ 以动态库的形式提供了一个接口层，具体实现（如Jaeger的C++客户端）实现这些接口

### The OpenTracing Data Model

核心抽象： Tracer，Span，SpanContext，Reference

> **Traces** in OpenTracing are defined implicitly by their **Spans**. In particular, a **Trace** can be thought of as a directed acyclic graph (DAG) of **Spans**, where the edges between **Spans** are called **References**.

Span从字面理解就是一个跨度，具体在追踪语境下指的是**时间上的跨度**。Span是为描述请求/应答模型量身定制的，一个Span封装了：

- 操作名称：e.g. RPC调用名；http请求的URL/endpoint；SQL语句等等
- 操作起始时间戳
- 耗时（duration）：Span名称的由来
- Tags: 一系列key-value对，描述整个Span的属性，比如RPC调用的参数，http请求参数等等
- Logs: 带时间戳的key-value对，描述在某个时刻发生了事情，比如http响应码等等
- SpanContext: 跨服务间传输的上下文信息，用于关联组成trace的一系列spans，一般包含 trace_id、span_id, baggage；最重要的就是trace_id
- References: span之间的引用关系，目前定义了两种，ChildOf 和 FollowsFrom

For example, the following is an example **Trace** made up of 8 **Spans**:

```
Causal relationships between Spans in a single Trace


        [Span A]  ←←←(the root span)
            |
     +------+------+
     |             |
 [Span B]      [Span C] ←←←(Span C is a `ChildOf` Span A)
     |             |
 [Span D]      +---+-------+
               |           |
           [Span E]    [Span F] >>> [Span G] >>> [Span H]
                                       ↑
                                       ↑
                                       ↑
                         (Span G `FollowsFrom` Span F)
```

### Span之间的关系

- ChildOf

  指的是，Parent Span的完成依赖于Child Span的完成。典型场景，前端的一次 http 请求引发后端多个组件的多个动作，每个动作都可以是一个Span，这些Span和前端http请求Span的关系就是ChildOf的，因为只有后端完成之后，才会返回http响应。

- FollowsFrom

  Parent Span的完成不依赖Child Span的完成。这个关系表达的仅仅是因果关系，即Child Span是由Parent Span引发的，Parent Span的完成不需要等待Child Span的完成，也就是没形成一个回路。（we say merely that the child Span `FollowsFrom` the parent Span in a causal sense. )

（LA中TraceRecord 中表达的parent关系，按照这个定义归属于FollowsFrom）

### Trace由Span来表达和定义

> A **trace** is a data/execution path through the system, and can be thought of as a directed acyclic graph of [spans](https://www.jaegertracing.io/docs/1.8/architecture#span).

### The OpenTracing API

C++：以动态库的形式提供接口层，具体Tracer实现（Jaeger的C++客户端）提供实现，对接对应的后端组件。定义了三个相互关联的关键抽象Tracer、Span、SpanContext

- Tracer （存在于应用侧，指应用看到的负责保存Span的Client Library中的对象）
  - Start a new Span
  - Inject a SpanContext into a carrier (http header, RPC frame)
  - Extrace a SpanContext from a carrier (http header, RPC frame)
- Span
  - Retrieve the SpanContext
  - Finish the Span（完成时间戳）
  - Set a Span Tags
  - Log structured data
  - Set a baggage item（保存在SpanContext上下文中，随请求在服务间传递， context propagation）
  - Get a baggage item
- SpanContext
  - Iterate through all baggage items

## 架构

<https://eng.uber.com/distributed-tracing/>

这篇文章给出了 Jaeger 系统架构的演变，讲述了 Uber 分布式追踪工具的发展时间线：从单体应用的追踪系统到基于微服务应用的分布式跟踪，从最初采用 Zipkin 数据模型以及部分组件到逐步开发出 Jaeger 的过程。Uber根据自己的实际情况，重新设计了数据模型，开发了新的 Client 库和相关后端组件。

![architecture](architecture.png)

**instrumentation side**: 开发新的Client库，遵循OpenTracing的语义规范

- jaeger-client：多种语言实现，保证互操作性（consistent instrumentation API in different languages）

**backend side 后端组件**：agent + collector + Cassandra + query + UI

- agent：network daemon，作为基础设施组件部署在host上，收集spans发送到collector，agent屏蔽了collector的发现和路由
- collector：部署多个组成cluster，从agent收集span，进行一些校验等处理，最终写入数据库
- Cassandra：数据库存储集群
- query：a **web server** that retrieves traces from storage and hosts a UI to display them
- UI：Web UI（search功能）
- Apache Spark：数据处理 pipeline（对收集到数据做进一步的加工）

**Control flow（创新点）**：控制采样率，由后端根据当前的压力决定，可动态调整（创新点）；Jaeger client samples 0.1% of traces (1 in 1000)——默认1/1000的采样率
