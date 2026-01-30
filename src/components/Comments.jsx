import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { insertComment, fetchComments } from '../lib/comments'

export default function Comments({ slug }) {
  const ref = useRef(null)
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const [user, setUser] = useState()
  const [comments, setComments] = useState([])
  const [comment, setComment] = useState("")
  const [numberOfComments, setNumberOfComments] = useState(0)

  const authorizeWithGithub = () => {
    supabase.auth.signInWithOAuth({provider: 'github', options: {
      redirectTo: window.location.protocol + '//' + window.location.host + window.location.pathname
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
        if (data) {
            setComments([...comments, ...data])
            setNumberOfComments(comments.length + 1)
        }
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
        if (res.data?.session) {
          setLoggedIn(true)
          setUser(res.data.session.user)
        }
      })

    fetchComments(slug)
      .then(({ data }) => {
        if (data) {
            setComments(data)
            setNumberOfComments(data.length)
        }
      })
  }, [slug, isIntersecting])

  return (
    <div id="comments" className='flex flex-col gap-2' ref={ref}>
      <h3 className="text-2xl font-bold">Comments ({numberOfComments})</h3>
      
      {comments && comments.map((comment, key) =>
        <div key={key} className='flex flex-col gap-2'>
          <p className="text-sm text-gray-500">Posted at {new Date(comment.created_at).toLocaleString("sv-SE")}</p>
          <div className='border-t py-2'>
            <pre className="whitespace-pre-wrap font-sans">{comment.content}</pre>
          </div>
        </div>
      )}

      <div className="mt-4">
        {loggedIn && (
          <div className='flex flex-col gap-2'>
            <textarea className='border p-2 w-full' placeholder='Write a comment ...' value={comment} onChange={(e) => setComment(e.target.value)} />
            <div className='flex justify-between items-baseline'>
              <button
                onClick={postComment}
                className='text-white bg-gray-800 hover:bg-gray-900 text-sm py-1 px-2 rounded-md'>
                Post anonymously
              </button>
              <div className='flex gap-1 text-sm'>
                <p>Authorized with Github</p>
                <button
                  className='underline cursor-pointer'
                  onClick={signOut}
                >
                  [Sign out]
                </button>
              </div>
            </div>
          </div>
        )}
        {!loggedIn && (
          <button onClick={authorizeWithGithub} className="text-sm underline cursor-pointer text-left">Authorize with Github to post anonymously</button>
        )}
      </div>
    </div>
  )
}
