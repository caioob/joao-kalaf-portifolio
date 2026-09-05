import Section from './layout/Section.jsx'
import Container from './layout/Container.jsx'

export default function Hero({ profile }) {
  return (
    <Section id="hero" reveal={false}>
      <Container className="relative">
        <h1 className="font-display text-display text-ink">{profile.name}</h1>
        {profile.logo && (
          <div
            aria-hidden="true"
            className="mt-4 flex justify-end lg:absolute lg:top-0 lg:left-1/2 lg:mt-0 lg:ml-16 lg:-translate-x-1/2 lg:-translate-y-4"
          >
            <img src={profile.logo} alt="" className="h-auto w-36 sm:w-48 lg:w-logo" />
          </div>
        )}
      </Container>
    </Section>
  )
}
