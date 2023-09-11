"use client";

import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../subabase'
import { insertComment, fetchComments } from '../../lib/comments'

const Comments = ({ slug, serverComments, setNumberOfComments }) => {
  const ref = useRef(null)
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const [user, setUser] = useState()
  const [comments, setComments] = useState(serverComments)
  const [comment, setComment] = useState("")

  const authorizeWithGithub = () => {
    supabase.auth.signInWithOAuth({provider: 'github', options: {
      redirectTo: location.protocol + '//' + location.host + location.pathname
    }})
  }

  const signOut = () => {
    supabase.auth.signOut()
      .then(() => {
        setUser(null)
        setLoggedIn(false)
        
      })
      .finally(() => window.location.reload())
  }

  const postComment = () => {
    if (!(loggedIn && user) || comment?.length <= 0) {
      return
    }

    insertComment(slug, comment)
      .then(({ data }) => {
        setComment("")
        setComments([...comments, ...data])
        setNumberOfComments(comments.length + 1)
      })
  }

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries && entries.length > 0 && entries[0].isIntersecting) {
        setIsIntersecting(true);
      }
    });

    if (ref?.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, [ref])

  useEffect(() => {
    if (!isIntersecting) {
      return
    }

    supabase.auth.getSession()
      .then(res => {
        if (res.data.session) {
          setLoggedIn(true)
          setUser(res.data.session.user)
        }
      })

    fetchComments(slug)
      .then(({ data }) => {
        setComments(data)
        setNumberOfComments(data.length)
      })
  }, [slug, isIntersecting])

  return (
    <div id="comments" className='flex flex-col gap-2' ref={ref}>
      <h3>Comments</h3>
      
      {comments && comments.map((comment, key) =>
        <div key={key} className='flex flex-col gap-2'>
          <p>Posted at {new Date(comment.created_at).toLocaleString("sv-SE")}</p>
          <div className='border-t py-2'>
            <pre>{comment.content}</pre>
          </div>
        </div>
      )}

      <div>
        {loggedIn && (
          <div className='flex flex-col gap-2'>
            <textarea className='border p-2' placeholder='Write a comment ...' value={comment} onChange={(e) => setComment(e.target.value)} />
            <div className='flex justify-between items-baseline'>
              <button
                onClick={postComment}
                className='text-white bg-gray-800 hover:bg-gray-900 text-sm py-1 px-2 rounded-md dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700'>
                Post anonymously
              </button>
              <div className='flex gap-1 text-sm'>
                <p>Authorized with Github</p>
                <a 
                  className='underline'
                  onClick={signOut}
                >
                  [Sign out]
                </a>
              </div>
            </div>
          </div>
        )}
        {!loggedIn && (
          <a onClick={authorizeWithGithub} className="text-sm underline">Authorize with Github to post anonymously</a>
        )}
      </div>
    </div>
  )
}

export default Comments