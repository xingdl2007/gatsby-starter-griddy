import React from 'react'
import { Link, graphql } from 'gatsby'
import Img from 'gatsby-image'
import profilpic from '../assets/images/profile.jpg'
import SEO from '../components/seo'
import IconButton from '../components/widget/icon-button'

const IndexPage = ({ data }) => {
  const { title, description, menuHome, social } = data.site.siteMetadata
  return (
    <>
      {/* Add seo props as you wish */}
      <SEO image={profilpic} />
      <main className='fade-in'>
        <article className='hero is-fullheight is-light'>
          <div className='hero-body'>
            <div className='container has-text-centered'>
              <div className='box has-bg-shadow coverbox has-rounded-corner'>
                <figure className='image'>
                  {/* Cover is large image, we load that using gatsby-image for optimize peformance */}
                  <Img
                    fluid={data.cover.childImageSharp.fluid}
                    className='image coverpic'
                    alt='Cover'
                  />
                </figure>
                <figure
                  // little cheat to stylize the profilepic under gatsby-image effect
                  id='profile_pic'
                  className='image is-128x128 has-image-centered'>
                  <div className='box is-box-profile'>
                    <Img
                      className='is-profile'
                      fluid={data.profilpic.childImageSharp.fluid}
                      alt='Profile'
                    />
                  </div>
                </figure>
                <div className='profile_info'>
                  <h1 className='title is-3' style={{ marginBottom: '1.9rem' }}>
                    {title}
                  </h1>
                  <h2
                    className='subtitle is-6'
                    style={{ marginBottom: '0.9rem' }}>
                    {description}
                  </h2>
                  <div
                    className='buttons is-centered'
                    style={{ marginTop: '0.8rem' }}>
                    {/* If wanna use button with icon you can use IconButton instead of Link */}
                    {menuHome.map((item, index) => (
                      <Link
                        className='button is-light'
                        key={`${index}--${item.name}`}
                        to={item.href}>
                        {item.name}
                      </Link>
                    ))}
                  </div>
                  <div className='content has-content-padding'>
                    <p className='title is-5 is-post-detail'>
                      Who ami I?
                    </p>
                    <p>
                      I am a c++/golang/rust programmer in a starup focus on fintech especially low-latency network
                      technology. Personally I'm interested in distributed systems, network, storage/file system, consensus and infrastructure.

                    </p>
                    <p className='title is-5 is-post-detail'
                      style={{ paddingTop: '1rem' }}>
                      Personal projects
                    </p>
                    <p>
                    <a href="https://github.com/xingdl2007/polly">Polly: A reactor-based C++ non-blocking network library inspired by muduo</a>
                    <br/>  
                    <a href="https://github.com/xingdl2007/6.824-2017">6.824: Distributed Systems (Spring 2017)</a>
                    <br/>
                    <a href="https://github.com/xingdl2007/6.828-2017">6.828: JOS: Operating Systems Engineering</a>
                    <br/>
                    <a href="https://github.com/xingdl2007/cmu15-445">CMU 15-445/645: Intro to Database Systems (Fall 2017)</a>
                    </p>
                    {/* put the social media icon here */}
                    <div className='buttons is-centered'>
                      {social.map((item, index) => (
                        <IconButton
                          key={`${index}--${item.name}`}
                          to={item.href}
                          icon={item.icon}
                          iconSize='24'
                          buttonClass='is-white is-large has-text-grey'
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>
      </main>
    </>
  )
}

export const query = graphql`
  query {
    cover: file(relativePath: { eq: "cover.jpg" }) {
      childImageSharp {
        fluid(quality: 90) {
          ...GatsbyImageSharpFluid
        }
      }
    }
    profilpic: file(relativePath: { eq: "profile.jpg" }) {
      childImageSharp {
        fluid(quality: 85) {
          ...GatsbyImageSharpFluid
        }
      }
    }
    site {
      siteMetadata {
        title
        description
        menuHome {
          name
          href
          icon
        }
        social: socialLink {
          name
          href
          icon
        }
      }
    }
  }
`

export default IndexPage
