const noButton = document.getElementById('no-button');
const buttonRow = document.getElementById('button-row');

function moveNoButton() {
  if (!noButton || !buttonRow) return;
  const parentRect = buttonRow.getBoundingClientRect();
  const buttonRect = noButton.getBoundingClientRect();
  const maxX = parentRect.width - buttonRect.width;
  const maxY = parentRect.height - buttonRect.height;
  const x = Math.random() * Math.max(0, maxX);
  const y = Math.random() * Math.max(0, maxY);
  noButton.style.transform = `translate(${x}px, ${y}px)`;
}

if (noButton) {
  noButton.addEventListener('mouseenter', moveNoButton);
  noButton.addEventListener('focus', moveNoButton);
  noButton.addEventListener('click', (event) => {
    event.preventDefault();
    moveNoButton();
  });
}

const scheduleForm = document.getElementById('schedule-form');
if (scheduleForm) {
  scheduleForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const day = document.getElementById('day').value;
    const time = document.getElementById('time').value;

    if (!day || !time) return;

    localStorage.setItem('askDate', day);
    localStorage.setItem('askTime', time);
    window.location.href = 'activity.html';
    
  });
}

const activityButtons = document.querySelectorAll('.btn-activity');
const summary = document.getElementById('summary');
const proposalInput = document.getElementById('proposal');
const confirmButton = document.getElementById('confirm-activity');

if (activityButtons.length > 0) {
  const day = localStorage.getItem('askDate');
  const time = localStorage.getItem('askTime');
  const selectedActivity = localStorage.getItem('askActivity');
  const formattedDay = day ? new Date(day).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }) : 'un giorno speciale';

  activityButtons.forEach((button) => {
    const activity = button.dataset.activity;
    if (activity === selectedActivity) button.classList.add('selected');

    button.addEventListener('click', () => {
      if (proposalInput && proposalInput.value.trim()) return;
      activityButtons.forEach((item) => item.classList.remove('selected'));
      button.classList.add('selected');
      localStorage.setItem('askActivity', activity);
      if (proposalInput) {
        proposalInput.value = '';
        localStorage.removeItem('askProposal');
        activityButtons.forEach((item) => { item.disabled = false; });
      }
      updateActivitySummary();
    });
  });

  if (proposalInput) {
    proposalInput.value = localStorage.getItem('askProposal') || '';
    const syncProposalState = () => {
      const proposalText = proposalInput.value.trim();
      localStorage.setItem('askProposal', proposalText);
      if (proposalText) {
        activityButtons.forEach((item) => {
          item.disabled = true;
          item.classList.remove('selected');
        });
        localStorage.removeItem('askActivity');
      } else {
        activityButtons.forEach((item) => {
          item.disabled = false;
        });
      }
    };

    proposalInput.addEventListener('input', () => {
      syncProposalState();
    });

    syncProposalState();
  }

  if (confirmButton) {
    confirmButton.addEventListener('click', () => {
      const activity = localStorage.getItem('askActivity');
      const proposal = proposalInput ? proposalInput.value.trim() : '';
      if (!activity && !proposal) {
        alert('Scegli prima un\'attività o scrivi una proposta, poi conferma.');
        return;
      }
      if (proposalInput) {
        localStorage.setItem('askProposal', proposal);
      }
      if (!activity) {
        localStorage.removeItem('askActivity');
      }
      window.location.href = 'recap.html';
    });
  }

  function updateActivitySummary() {
    const activity = localStorage.getItem('askActivity');
    const proposal = localStorage.getItem('askProposal');
    if (!activity || !summary) return;

    let message = `Hai scelto: ${activity}. Ci vediamo ${formattedDay} alle ${time}.`;
    if (proposal) {
      message += `
      Proposta extra: ${proposal}.`;
    } else {
      message += ' Se vuoi, puoi anche suggerire qualcosa di diverso.';
    }

    summary.textContent = message;
  }

  if (summary && day && time) {
    summary.textContent = `Hai scelto: ${formattedDay} alle ${time}. Ora scegli l'attività.`;
  }

  if (selectedActivity) {
    updateActivitySummary();
  }
}

const recapSummary = document.getElementById('recap-summary');
if (recapSummary) {
  const day = localStorage.getItem('askDate');
  const time = localStorage.getItem('askTime');
  const activity = localStorage.getItem('askActivity');
  const proposal = localStorage.getItem('askProposal');
  const notifyEmail = 'astolfigio@gmail.com';

  const formattedDay = day ? new Date(day).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }) : 'un giorno speciale';
  const safeActivity = activity || '';
  const safeTime = time ? `alle ${time}` : 'in un orario da definire';
  const safeProposal = proposal ? `\nProposta: ${proposal}` : '';
  const activityPart = safeActivity ? ` per ${safeActivity}` : '';
  const finalText = `Perfetto! Ci vediamo ${formattedDay} ${safeTime}${activityPart}.${safeProposal}`.trim();

  // Show the final selection in the recap page
  recapSummary.textContent = finalText;

  const sendWithFormSubmit = async () => {
    try {
      const formData = new FormData();
      formData.append('_subject', 'Risultato uscita');
      formData.append('message', finalText);
      formData.append('_captcha', 'false');
      formData.append('_template', 'table');

      // Send in background. We don't handle or show any status to the visitor.
      await fetch(`https://formsubmit.co/${encodeURIComponent(notifyEmail)}`, {
        method: 'POST',
        body: formData,
        keepalive: true,
      });
    } catch (error) {
      // Silent on purpose
    }
  };

  sendWithFormSubmit();
}
