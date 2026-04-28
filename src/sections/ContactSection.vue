<script setup>
/**
 * ContactSection.vue — Section Contact
 * ──────────────────────────────────────
 * - Formulaire de contact avec feedback visuel
 * - 2 calques parallax décoratifs
 * - useReveal sur le formulaire
 * - handleSubmit affiche "✓ Message envoyé !" et reset après 3s
 */
import { ref }       from 'vue'
import ParallaxLayer from '@/components/ParallaxLayer.vue'
import { useReveal } from '@/composables/useReveal.js'

// ── Props ──────────────────────────────────────────────────────
const props = defineProps({
  /** Objet person pour l'email de contact (person.email) */
  person: { type: Object, required: true },
})

// ── État du formulaire ─────────────────────────────────────────
/** Modèle des champs du formulaire */
const form = ref({
  name:    '',
  email:   '',
  message: '',
})

/** Message de feedback affiché après soumission */
const feedback = ref('')

/** true quand la soumission est en cours / terminée (bloque le bouton) */
const submitted = ref(false)

// ── Reveal ────────────────────────────────────────────────────
const formRef = ref(null)
useReveal(formRef)

/**
 * handleSubmit(event)
 * Simule l'envoi du formulaire (pas de backend).
 * Affiche un message de confirmation pendant 3 secondes, puis reset.
 *
 * @param {Event} event
 */
function handleSubmit(event) {
  event.preventDefault()
  if (submitted.value) return

  submitted.value = true
  feedback.value  = '✓ Message envoyé ! Je reviens vers vous sous 48h.'

  // Reset après 3 secondes
  setTimeout(() => {
    form.value     = { name: '', email: '', message: '' }
    feedback.value = ''
    submitted.value = false
  }, 3000)
}
</script>

<template>
  <section id="contact" class="section contact">

    <!-- Calques parallax décoratifs -->
    <ParallaxLayer :depth="0.12">
      <div class="contact__bg-noise" />
    </ParallaxLayer>

    <ParallaxLayer :depth="0.28">
      <div class="contact__deco-cross" aria-hidden="true">+</div>
    </ParallaxLayer>

    <div class="container">

      <h2 class="section__title">CONTACT</h2>

      <div class="contact__wrapper">

        <!-- Bloc info gauche -->
        <div class="contact__info">
          <p class="contact__intro">
            Un projet, une mission freelance, une collaboration ?<br>
            Discutons-en.
          </p>
          <a
            :href="`mailto:${props.person.email}`"
            class="contact__email"
          >
            {{ props.person.email }}
          </a>
          <div class="contact__availability">
            <span class="contact__avail-dot" aria-hidden="true" />
            Disponible pour missions
          </div>
        </div>

        <!-- Formulaire -->
        <form
          ref="formRef"
          class="contact__form reveal"
          novalidate
          @submit="handleSubmit"
        >

          <div class="contact__field">
            <label class="contact__label" for="contact-name">NOM</label>
            <input
              id="contact-name"
              v-model="form.name"
              type="text"
              class="contact__input"
              placeholder="SullyVan DUPONT"
              required
              autocomplete="name"
            />
          </div>

          <div class="contact__field">
            <label class="contact__label" for="contact-email">EMAIL</label>
            <input
              id="contact-email"
              v-model="form.email"
              type="email"
              class="contact__input"
              placeholder="votre@email.dev"
              required
              autocomplete="email"
            />
          </div>

          <div class="contact__field">
            <label class="contact__label" for="contact-message">MESSAGE</label>
            <textarea
              id="contact-message"
              v-model="form.message"
              class="contact__textarea"
              rows="5"
              placeholder="Votre message..."
              required
            />
          </div>

          <!-- Bouton + feedback -->
          <div class="contact__actions">
            <button
              type="submit"
              class="btn btn--primary"
              :disabled="submitted"
            >
              {{ submitted ? 'ENVOYÉ ✓' : 'ENVOYER' }}
            </button>

            <!-- Message de confirmation -->
            <Transition name="feedback">
              <p v-if="feedback" class="contact__feedback" role="status">
                {{ feedback }}
              </p>
            </Transition>
          </div>

        </form>
      </div>
    </div>

    <!-- Pied de page -->
    <div class="contact__footer">
      <p class="contact__footer-text">
        © {{ new Date().getFullYear() }} {{ props.person.firstName }} {{ props.person.lastName }} · Fait avec Vue 3 + Vite
      </p>
    </div>

  </section>
</template>

<style scoped>
.contact {
  background-color: var(--color-bg);
  min-height:       60vh;
}

/* ── Layout ─────────────────────────────────────────────── */
.contact__wrapper {
  display:               grid;
  grid-template-columns: 1fr 1.5fr;
  gap:                   var(--spacing-xl);
  align-items:           start;
}

/* ── Info ───────────────────────────────────────────────── */
.contact__intro {
  font-size:     var(--text-lg);
  font-weight:   600;
  line-height:   1.5;
  margin-bottom: var(--spacing-md);
}

.contact__email {
  display:        block;
  font-family:    var(--font-mono);
  font-size:      var(--text-base);
  color:          var(--color-accent-1);
  border-bottom:  2px solid var(--color-accent-1);
  display:        inline-block;
  margin-bottom:  var(--spacing-md);
  transition:     color var(--transition-fast), border-color var(--transition-fast);
}
.contact__email:hover {
  color:        var(--color-accent-2);
  border-color: var(--color-accent-2);
}

.contact__availability {
  font-family:    var(--font-mono);
  font-size:      var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color:          color-mix(in srgb, var(--color-fg) 60%, transparent);
  display:        flex;
  align-items:    center;
  gap:            0.5rem;
}

.contact__avail-dot {
  width:         8px;
  height:        8px;
  border-radius: 50%;
  background:    var(--color-accent-3);
  animation:     blink-label 2s ease-in-out infinite;
  display:       inline-block;
}

/* ── Formulaire ─────────────────────────────────────────── */
.contact__form {
  display:        flex;
  flex-direction: column;
  gap:            var(--spacing-md);
}

.contact__field {
  display:        flex;
  flex-direction: column;
  gap:            0.4rem;
}

.contact__label {
  font-family:    var(--font-mono);
  font-size:      var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color:          color-mix(in srgb, var(--color-fg) 60%, transparent);
}

.contact__input,
.contact__textarea {
  background:   var(--color-surface);
  border:       var(--border-thick);
  color:        var(--color-fg);
  font-family:  var(--font-body);
  font-size:    var(--text-base);
  padding:      0.75rem 1rem;
  border-radius: var(--radius-brutal);
  outline:       none;
  transition:   border-color var(--transition-fast), box-shadow var(--transition-fast);
  resize:       none;
  width:        100%;
}

.contact__input:focus,
.contact__textarea:focus {
  border-color: var(--color-accent-1);
  box-shadow:   4px 4px 0px var(--color-accent-1);
}

.contact__textarea { resize: vertical; min-height: 120px; }

/* ── Actions ────────────────────────────────────────────── */
.contact__actions {
  display:     flex;
  align-items: center;
  gap:         var(--spacing-md);
  flex-wrap:   wrap;
}

.contact__feedback {
  font-family:  var(--font-mono);
  font-size:    var(--text-sm);
  color:        var(--color-accent-3);
  font-weight:  600;
}

/* ── Transition feedback ────────────────────────────────── */
.feedback-enter-active,
.feedback-leave-active {
  transition: opacity var(--transition-normal), transform var(--transition-normal);
}
.feedback-enter-from,
.feedback-leave-to {
  opacity:   0;
  transform: translateY(6px);
}

/* ── Décors parallax ────────────────────────────────────── */
.contact__bg-noise {
  position: absolute;
  inset:    0;
  opacity:  0.03;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 200px 200px;
}

.contact__deco-cross {
  font-family: var(--font-display);
  font-size:   12rem;
  font-weight: 700;
  color:       color-mix(in srgb, var(--color-accent-2) 8%, transparent);
  right:       5%;
  bottom:      10%;
  position:    absolute;
  line-height: 1;
  pointer-events: none;
  user-select:    none;
}

/* ── Footer ─────────────────────────────────────────────── */
.contact__footer {
  margin-top:   var(--spacing-xl);
  padding:      var(--spacing-md);
  border-top:   2px solid color-mix(in srgb, var(--color-fg) 15%, transparent);
  text-align:   center;
}

.contact__footer-text {
  font-family:    var(--font-mono);
  font-size:      var(--text-xs);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color:          color-mix(in srgb, var(--color-fg) 40%, transparent);
}

/* ── Responsive ─────────────────────────────────────────── */
@media (max-width: 768px) {
  .contact__wrapper {
    grid-template-columns: 1fr;
  }
}
</style>
