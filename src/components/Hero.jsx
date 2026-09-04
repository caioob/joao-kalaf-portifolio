import Section from './layout/Section.jsx'
import Container from './layout/Container.jsx'

export default function Hero({ profile }) {
  return (
    <Section id="hero" reveal={false}>
      <Container>
        <h1 className="font-display text-display text-ink">{profile.name}</h1>
      </Container>
    </Section>
  )
}
